import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { initialHabits } from '@/lib/habit-data';

export interface Capsule {
  id: string;
  habitKey: string;
  capsuleIndex: number;
  label: string;
  value: number;
  isCompleted: boolean;
  scheduledTime?: string;
}

export const useCapsules = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const fetchCapsules = async () => {
    if (!userId) return [];

    const today = new Date().toISOString().split('T')[0];
    
    // Fetch existing capsules for today
    const { data: existing, error } = await supabase
      .from('habit_capsules')
      .select('*')
      .eq('user_id', userId)
      .eq('created_at', today);

    if (error) throw error;
    return existing;
  };

  const { data: dbCapsules, isLoading } = useQuery({
    queryKey: ['habitCapsules', userId],
    queryFn: fetchCapsules,
    enabled: !!userId,
  });

  const completeCapsule = useMutation({
    mutationFn: async ({ habitKey, index, mood }: { habitKey: string, index: number, mood?: string }) => {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('habit_capsules')
        .upsert({
          user_id: userId!,
          habit_key: habitKey,
          capsule_index: index,
          is_completed: true,
          mood: mood,
          created_at: today,
          label: `Capsule ${index + 1}`, // Default label if not existing
          value: 0 // Will be derived
        }, { onConflict: 'user_id, habit_key, capsule_index, created_at' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
    }
  });

  const scheduleCapsule = useMutation({
    mutationFn: async ({ habitKey, index, time }: { habitKey: string, index: number, time: string }) => {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('habit_capsules')
        .upsert({
          user_id: userId!,
          habit_key: habitKey,
          capsule_index: index,
          scheduled_time: time,
          created_at: today,
          label: `Capsule ${index + 1}`,
          value: 0
        }, { onConflict: 'user_id, habit_key, capsule_index, created_at' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId] });
    }
  });

  return { dbCapsules, isLoading, completeCapsule, scheduleCapsule };
};