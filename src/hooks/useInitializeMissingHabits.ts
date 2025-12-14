import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';

interface MissingHabit {
  habit_key: string;
  long_term_goal: number;
  target_completion_date: string;
  current_daily_goal: number;
}

const initializeMissingHabits = async (userId: string) => {
  // Check which habits are missing for the user
  const { data: existingHabits, error: fetchError } = await supabase
    .from('user_habits')
    .select('habit_key')
    .eq('user_id', userId);

  if (fetchError) throw fetchError;

  const existingHabitKeys = new Set(existingHabits?.map(h => h.habit_key) || []);
  
  // Define the habits that should be ensured to exist
  const habitsToEnsure: MissingHabit[] = [];
  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];

  // Check for teeth_brushing
  habitsToEnsure.push({
    habit_key: 'teeth_brushing',
    long_term_goal: 365,
    target_completion_date: oneYearDateString,
    current_daily_goal: 1
  });

  // Check for medication
  habitsToEnsure.push({
    habit_key: 'medication',
    long_term_goal: 365,
    target_completion_date: oneYearDateString,
    current_daily_goal: 1
  });

  // Filter to only include habits that are actually missing, or just upsert all defaults
  // Since the `handle_new_user` trigger might have already inserted them, we use upsert
  // to safely insert or update the default values if they are missing or need resetting.
  
  const habitsToUpsert = habitsToEnsure.map(habit => ({
    user_id: userId,
    habit_key: habit.habit_key,
    long_term_goal: habit.long_term_goal,
    target_completion_date: habit.target_completion_date,
    current_daily_goal: habit.current_daily_goal,
    momentum_level: 'Building'
  }));

  if (habitsToUpsert.length > 0) {
    // Use upsert to insert if not present, or update if present (though we only update the default fields here)
    const { error: upsertError } = await supabase
      .from('user_habits')
      .upsert(habitsToUpsert, { onConflict: 'user_id, habit_key', ignoreDuplicates: true });

    if (upsertError) throw upsertError;
  }

  // We return the list of habits that were checked, not necessarily inserted
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
        console.log('Ensured default habits exist.');
        // Invalidate dashboard data to refresh with new habits
        queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
        queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      }
    },
    onError: (error) => {
      // We only show an error if it's not the expected 409 conflict (which upsert should prevent)
      // However, since we are using `ignoreDuplicates: true` in upsert, we should not see 409 errors anymore.
      showError(`Failed to ensure habits exist: ${error.message}`);
      console.error('Error ensuring default habits exist:', error);
    },
  });
};