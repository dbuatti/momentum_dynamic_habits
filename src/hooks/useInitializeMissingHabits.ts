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
  plateau_days_required: number; // Added
}

const initializeMissingHabits = async (userId: string) => {
  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];
  
  // Define ALL default habits with a default plateau_days_required
  const habitsToEnsure: DefaultHabit[] = [
    { habit_key: 'pushups', long_term_goal: 200, target_completion_date: oneYearDateString, current_daily_goal: 1, is_fixed: false, plateau_days_required: 7 },
    { habit_key: 'meditation', long_term_goal: 120, target_completion_date: oneYearDateString, current_daily_goal: 5, is_fixed: false, plateau_days_required: 7 },
    { habit_key: 'kinesiology', long_term_goal: 60, target_completion_date: oneYearDateString, current_daily_goal: 10, is_fixed: false, plateau_days_required: 7 },
    { habit_key: 'piano', long_term_goal: 60, target_completion_date: oneYearDateString, current_daily_goal: 10, is_fixed: false, plateau_days_required: 7 },
    { habit_key: 'housework', long_term_goal: 30, target_completion_date: oneYearDateString, current_daily_goal: 30, is_fixed: false, plateau_days_required: 7 },
    { habit_key: 'projectwork', long_term_goal: 1000, target_completion_date: oneYearDateString, current_daily_goal: 60, is_fixed: false, plateau_days_required: 7 },
    { habit_key: 'teeth_brushing', long_term_goal: 365, target_completion_date: oneYearDateString, current_daily_goal: 2, is_fixed: true, plateau_days_required: 7 },
    { habit_key: 'medication', long_term_goal: 365, target_completion_date: oneYearDateString, current_daily_goal: 1, is_fixed: true, plateau_days_required: 7 },
  ];

  const habitsToUpsert = habitsToEnsure.map(habit => ({
    user_id: userId,
    habit_key: habit.habit_key,
    long_term_goal: habit.long_term_goal,
    target_completion_date: habit.target_completion_date,
    current_daily_goal: habit.current_daily_goal,
    momentum_level: 'Building',
    is_fixed: habit.is_fixed,
    days_of_week: [0, 1, 2, 3, 4, 5, 6], // Default to all days
    plateau_days_required: habit.plateau_days_required, // Include new field
  }));

  if (habitsToUpsert.length > 0) {
    // ignoreDuplicates: true ensures we only create habits that aren't already there
    const { error: upsertError } = await supabase
      .from('user_habits')
      .upsert(habitsToUpsert, { onConflict: 'user_id, habit_key', ignoreDuplicates: true });

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
        queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
        queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      }
    },
    onError: (error) => {
      showError(`Failed to ensure habits exist: ${error.message}`);
    },
  });
};