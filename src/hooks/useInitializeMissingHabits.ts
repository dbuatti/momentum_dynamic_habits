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
  
  // Define the missing habits that should be initialized
  const missingHabits: MissingHabit[] = [];
  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];

  // Check for teeth_brushing
  if (!existingHabitKeys.has('teeth_brushing')) {
    missingHabits.push({
      habit_key: 'teeth_brushing',
      long_term_goal: 365,
      target_completion_date: oneYearDateString,
      current_daily_goal: 1
    });
  }

  // Check for medication
  if (!existingHabitKeys.has('medication')) {
    missingHabits.push({
      habit_key: 'medication',
      long_term_goal: 365,
      target_completion_date: oneYearDateString,
      current_daily_goal: 1
    });
  }

  // If there are missing habits, insert them
  if (missingHabits.length > 0) {
    const { error: insertError } = await supabase
      .from('user_habits')
      .insert(
        missingHabits.map(habit => ({
          user_id: userId,
          habit_key: habit.habit_key,
          long_term_goal: habit.long_term_goal,
          target_completion_date: habit.target_completion_date,
          current_daily_goal: habit.current_daily_goal,
          momentum_level: 'Building'
        }))
      );

    if (insertError) throw insertError;
  }

  return { initialized: missingHabits.length > 0, habits: missingHabits };
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
        console.log('Initialized missing habits:', data.habits);
        // Invalidate dashboard data to refresh with new habits
        queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
        queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      }
    },
    onError: (error) => {
      showError(`Failed to initialize habits: ${error.message}`);
      console.error('Error initializing missing habits:', error);
    },
  });
};