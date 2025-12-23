import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { LogHabitParams, UnlogHabitParams } from '@/types/habit'; // Assuming types are here
import { useSession } from '@/contexts/SessionContext';
import { calculateXpForTask } from '@/utils/xp-utils';
import { addDays, startOfDay } from 'date-fns';

export const useHabitLog = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user?.id;

  const logHabit = useMutation({
    mutationFn: async ({ habitKey, value, taskName, note }: LogHabitParams) => {
      if (!userId) throw new Error('User not authenticated');

      // Fetch habit details to get its XP value
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .select('xp_value')
        .eq('key', habitKey)
        .eq('user_id', userId)
        .single();

      if (habitError) throw habitError;
      if (!habit) throw new Error('Habit not found');

      const xpEarned = calculateXpForTask(habit.xp_value, value);

      const { data, error } = await supabase
        .from('completed_tasks')
        .insert({
          user_id: userId,
          habit_key: habitKey,
          task_name: taskName,
          value: value,
          xp_earned: xpEarned,
          note: note,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user XP
      await supabase.rpc('increment_user_xp', { user_id_param: userId, xp_to_add: xpEarned });

      return { success: true, taskName, xpEarned };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', userId] });
      queryClient.invalidateQueries({ queryKey: ['analyticsData', userId] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks', userId] });
    },
  });

  const unlogHabit = useMutation({
    mutationFn: async ({ habitKey, taskName }: UnlogHabitParams) => {
      if (!userId) throw new Error('User not authenticated');

      // Find the most recent completed task for this habit and task name today
      const today = startOfDay(new Date()).toISOString();
      const tomorrow = startOfDay(addDays(new Date(), 1)).toISOString();

      const { data: completedTask, error: fetchError } = await supabase
        .from('completed_tasks')
        .select('id, xp_earned')
        .eq('user_id', userId)
        .eq('habit_key', habitKey)
        .eq('task_name', taskName)
        .gte('completed_at', today)
        .lt('completed_at', tomorrow)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw fetchError;
      }
      if (!completedTask) {
        throw new Error('No matching completed task found to unlog for today.');
      }

      const { error: deleteError } = await supabase
        .from('completed_tasks')
        .delete()
        .eq('id', completedTask.id);

      if (deleteError) throw deleteError;

      // Decrement user XP
      await supabase.rpc('decrement_user_xp', { user_id_param: userId, xp_to_subtract: completedTask.xp_earned });

      return { success: true, taskName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', userId] });
      queryClient.invalidateQueries({ queryKey: ['analyticsData', userId] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks', userId] });
    },
  });

  return { logHabit, unlogHabit, isLoggingHabit: logHabit.isPending || unlogHabit.isPending };
};