"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useHabitLog } from './useHabitLog'; // Import useHabitLog

export interface Capsule {
  id?: string;
  user_id?: string;
  habit_key: string;
  capsule_index: number;
  value: number;
  label?: string;
  is_completed: boolean;
  mood?: string | null;
  scheduled_time?: string | null;
  created_at: string;
  completed_task_id?: string | null; // New field
}

export const useCapsules = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const today = new Date().toISOString().split('T')[0];

  const fetchCapsules = async (): Promise<Capsule[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('habit_capsules')
      .select('*')
      .eq('user_id', userId)
      .eq('created_at', today)
      .order('capsule_index', { ascending: true });

    if (error) {
      console.error('Error fetching capsules:', error);
      throw error;
    }

    return data || [];
  };

  const { data: dbCapsules = [], isLoading } = useQuery({
    queryKey: ['habitCapsules', userId, today],
    queryFn: fetchCapsules,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { mutate: logHabit, unlog: unlogHabitFromHook } = useHabitLog(); // Get logHabit and unlog from useHabitLog

  const logCapsuleProgress = useMutation({
    mutationFn: async ({
      habitKey,
      index,
      value,
      mood,
      taskName, // Added taskName for logging
      isComplete, // Added isComplete parameter
    }: {
      habitKey: string;
      index: number;
      value: number;
      mood?: string;
      taskName: string; // Required for logging
      isComplete: boolean; // New parameter
    }) => {
      if (!userId) throw new Error('User not authenticated');
      console.log(`[useCapsules] logCapsuleProgress mutationFn called for habitKey: ${habitKey}, index: ${index}, value: ${value}, isComplete: ${isComplete}`);

      // First, log the habit and get the completedTaskId
      const { completedTaskId } = await logHabit({ habitKey, value, taskName, note: mood }); // Destructure completedTaskId
      console.log(`[useCapsules] logHabit returned completedTaskId: ${completedTaskId}`);

      const upsertData: Partial<Capsule> = {
        user_id: userId,
        habit_key: habitKey,
        capsule_index: index,
        value,
        is_completed: isComplete, // Use the new isComplete parameter
        mood: mood || null,
        created_at: today,
        label: `Part ${index + 1}`,
        completed_task_id: completedTaskId, // Store the completed task ID
      };

      const { error } = await supabase
        .from('habit_capsules')
        .upsert(upsertData, {
          onConflict: 'user_id,habit_key,capsule_index,created_at',
        });

      if (error) {
        console.error(`[useCapsules] Error upserting capsule for ${habitKey}-${index}:`, error);
        throw error;
      }
      console.log(`[useCapsules] Capsule upserted successfully for ${habitKey}-${index}.`);
    },
    onSuccess: () => {
      console.log('[useCapsules] logCapsuleProgress onSuccess. Invalidating queries.');
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId, today] });
      // Also invalidate dashboard data to reflect changes in dailyProgress
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
    },
    onError: (error) => {
      console.error('[useCapsules] logCapsuleProgress onError:', error);
    }
  });

  const uncompleteCapsule = useMutation({
    mutationFn: async ({
      habitKey,
      index,
      completedTaskId, // Accept completedTaskId
    }: {
      habitKey: string;
      index: number;
      completedTaskId: string; // Required for unlogging
    }) => {
      if (!userId) throw new Error('User not authenticated');
      console.log(`[useCapsules] uncompleteCapsule mutationFn called for habitKey: ${habitKey}, index: ${index}, completedTaskId: ${completedTaskId}`);

      // First, unlog the habit using the completedTaskId
      await unlogHabitFromHook({ completedTaskId });
      console.log(`[useCapsules] unlogHabitFromHook called for completedTaskId: ${completedTaskId}`);

      const { error } = await supabase
        .from('habit_capsules')
        .update({ is_completed: false, mood: null, completed_task_id: null }) // Set completed_task_id to null
        .eq('user_id', userId)
        .eq('habit_key', habitKey)
        .eq('capsule_index', index)
        .eq('created_at', today);

      if (error) {
        console.error(`[useCapsules] Error updating capsule to uncomplete for ${habitKey}-${index}:`, error);
        throw error;
      }
      console.log(`[useCapsules] Capsule marked as uncompleted for ${habitKey}-${index}.`);
    },
    onSuccess: () => {
      console.log('[useCapsules] uncompleteCapsule onSuccess. Invalidating queries.');
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId, today] });
      // Also invalidate dashboard data to reflect changes in dailyProgress
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
    },
    onError: (error) => {
      console.error('[useCapsules] uncompleteCapsule onError:', error);
    }
  });

  const scheduleCapsule = useMutation({
    mutationFn: async ({
      habitKey,
      index,
      time,
    }: {
      habitKey: string;
      index: number;
      time: string;
    }) => {
      if (!userId) throw new Error('User not authenticated');
      console.log(`[useCapsules] scheduleCapsule mutationFn called for habitKey: ${habitKey}, index: ${index}, time: ${time}`);

      const { error } = await supabase
        .from('habit_capsules')
        .upsert(
          {
            user_id: userId,
            habit_key: habitKey,
            capsule_index: index,
            scheduled_time: time,
            created_at: today,
            value: 0,
            is_completed: false, // Ensure it's not marked complete on schedule
            completed_task_id: null, // Ensure no completed_task_id on schedule
          },
          {
            onConflict: 'user_id,habit_key,capsule_index,created_at',
          }
        );

      if (error) {
        console.error(`[useCapsules] Error scheduling capsule for ${habitKey}-${index}:`, error);
        throw error;
      }
      console.log(`[useCapsules] Capsule scheduled successfully for ${habitKey}-${index}.`);
    },
    onSuccess: () => {
      console.log('[useCapsules] scheduleCapsule onSuccess. Invalidating queries.');
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId, today] });
    },
    onError: (error) => {
      console.error('[useCapsules] scheduleCapsule onError:', error);
    }
  });

  const resetCapsulesForToday = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      console.log(`[useCapsules] resetCapsulesForToday mutationFn called for userId: ${userId}`);

      // Before deleting capsules, unlog any associated completed tasks
      const currentCapsules = await fetchCapsules();
      for (const capsule of currentCapsules) {
        if (capsule.completed_task_id) { // Check for completed_task_id
          console.log(`[useCapsules] Resetting: Unlogging task ${capsule.completed_task_id} for capsule ${capsule.habit_key}-${capsule.capsule_index}`);
          unlogHabitFromHook({ completedTaskId: capsule.completed_task_id });
        }
      }

      const { error } = await supabase
        .from('habit_capsules')
        .delete()
        .eq('user_id', userId)
        .eq('created_at', today);

      if (error) {
        console.error(`[useCapsules] Error deleting capsules for userId: ${userId}:`, error);
        throw error;
      }
      console.log(`[useCapsules] All capsules reset for userId: ${userId}.`);
    },
    onSuccess: () => {
      console.log('[useCapsules] resetCapsulesForToday onSuccess. Invalidating queries.');
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId, today] });
    },
    onError: (error) => {
      console.error('[useCapsules] resetCapsulesForToday onError:', error);
    }
  });

  return {
    dbCapsules,
    isLoading,
    logCapsuleProgress,
    uncompleteCapsule,
    scheduleCapsule,
    resetCapsulesForToday,
  };
};