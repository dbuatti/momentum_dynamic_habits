import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import { initialHabits } from '@/lib/habit-data';

interface DefaultHabit {
  habit_key: string;
  long_term_goal: number;
  target_completion_date: string;
  current_daily_goal: number;
  is_fixed: boolean;
}

const initializeMissingHabits = async (userId: string) => {
  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];
  
  // Define ALL default habits and their desired initial state, enforcing the 10 min goal for Kinesiology/Piano
  const habitsToEnsure: DefaultHabit[] = [
    { habit_key: 'pushups', long_term_goal: 200, target_completion_date: oneYearDateString, current_daily_goal: 1, is_fixed: false },
    { habit_key: 'meditation', long_term_goal: 120, target_completion_date: oneYearDateString, current_daily_goal: 5, is_fixed: false },
    { habit_key: 'kinesiology', long_term_goal: 60, target_completion_date: oneYearDateString, current_daily_goal: 10, is_fixed: false }, // Enforcing 10 min
    { habit_key: 'piano', long_term_goal: 60, target_completion_date: oneYearDateString, current_daily_goal: 10, is_fixed: false }, // Enforcing 10 min
    { habit_key: 'housework', long_term_goal: 30, target_completion_date: oneYearDateString, current_daily_goal: 30, is_fixed: false },
    { habit_key: 'projectwork', long_term_goal: 1000, target_completion_date: oneYearDateString, current_daily_goal: 60, is_fixed: false },
    { habit_key: 'teeth_brushing', long_term_goal: 365, target_completion_date: oneYearDateString, current_daily_goal: 2, is_fixed: true }, // Enforcing 2 min fixed
    { habit_key: 'medication', long_term_goal: 365, target_completion_date: oneYearDateString, current_daily_goal: 1, is_fixed: true }, // Enforcing 1 dose fixed
  ];

  const habitsToUpsert = habitsToEnsure.map(habit => ({
    user_id: userId,
    habit_key: habit.habit_key,
    long_term_goal: habit.long_term_goal,
    target_completion_date: habit.target_completion_date,
    current_daily_goal: habit.current_daily_goal,
    momentum_level: 'Building',
    is_fixed: habit.is_fixed,
  }));

  if (habitsToUpsert.length > 0) {
    // Use upsert without ignoreDuplicates: true to force update existing records
    const { error: upsertError } = await supabase
      .from('user_habits')
      .upsert(habitsToUpsert, { onConflict: 'user_id, habit_key' });

    if (upsertError) throw upsertError;
  }

  return { initialized: habitsToUpsert.length > 0, habits: habitsToUpsert };
};

export const useInitializeMissingHabits = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return initializeMissingHabits(session.user.id);
    },
    onSuccess: (data) => {
      if (data.initialized) {
        console.log('Ensured default habits exist and goals are up-to-date.');
        // Invalidate dashboard data to refresh with new habits
        queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
        queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      }
    },
    onError: (error) => {
      showError(`Failed to ensure habits exist: ${error.message}`);
      console.error('Error ensuring default habits exist:', error);
    },
  });
};