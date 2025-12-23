"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useHabitLog } from './useHabitLog';

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
  completed_task_id?: string | null;
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

  const { mutate: logHabit, unlog: unlogHabitFromHook } = useHabitLog();

  const logCapsuleProgress = useMutation({
    mutationFn: async ({
      habitKey,
      index,
      value,
      mood,
      taskName,
      isComplete,
    }: {
      habitKey: string;
      index: number;
      value: number;
      mood?: string;
      taskName: string;
      isComplete: boolean;
    }) => {
      if (!userId) throw new Error('User not authenticated');

      // 1. Log the habit WITH the capsuleIndex
      const { completedTaskId } = await logHabit({ 
        habitKey, 
        value, 
        taskName, 
        note: mood,
        capsuleIndex: index // PASS THE INDEX
      });

      // 2. Legacy support for habit_capsules table
      const upsertData: Partial<Capsule> = {
        user_id: userId,
        habit_key: habitKey,
        capsule_index: index,
        value,
        is_completed: isComplete,
        mood: mood || null,
        created_at: today,
        label: `Part ${index + 1}`,
        completed_task_id: completedTaskId,
      };

      const { error } = await supabase
        .from('habit_capsules')
        .upsert(upsertData, {
          onConflict: 'user_id,habit_key,capsule_index,created_at',
        });

      if (error) {
        console.error(`[useCapsules] Error upserting capsule:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId, today] });
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
      completedTaskId,
    }: {
      habitKey: string;
      index: number;
      completedTaskId: string;
    }) => {
      if (!userId) throw new Error('User not authenticated');

      // 1. Unlog using the task ID
      await unlogHabitFromHook({ completedTaskId });

      // 2. Update legacy table
      const { error } = await supabase
        .from('habit_capsules')
        .update({ is_completed: false, mood: null, completed_task_id: null })
        .eq('user_id', userId)
        .eq('habit_key', habitKey)
        .eq('capsule_index', index)
        .eq('created_at', today);

      if (error) {
        console.error(`[useCapsules] Error updating capsule:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId, today] });
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
            is_completed: false,
            completed_task_id: null,
          },
          {
            onConflict: 'user_id,habit_key,capsule_index,created_at',
          }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId, today] });
    },
  });

  const resetCapsulesForToday = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const currentCapsules = await fetchCapsules();
      for (const capsule of currentCapsules) {
        if (capsule.completed_task_id) {
          unlogHabitFromHook({ completedTaskId: capsule.completed_task_id });
        }
      }

      const { error } = await supabase
        .from('habit_capsules')
        .delete()
        .eq('user_id', userId)
        .eq('created_at', today);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId, today] });
    },
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