import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import { initialHabits } from '@/lib/habit-data';
import { UserHabitRecord } from '@/types/habit';

// Modified to accept selectedHabitKeys
const initializeSelectedHabits = async (userId: string, selectedHabitKeys: string[]) => {
  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];
  
  const habitsToUpsert: Partial<UserHabitRecord>[] = initialHabits
    .filter(habitConfig => selectedHabitKeys.includes(habitConfig.id)) // Filter based on selected keys
    .map(habitConfig => ({
      user_id: userId,
      habit_key: habitConfig.id,
      name: habitConfig.name, // Added name
      unit: habitConfig.unit, // Added unit
      xp_per_unit: habitConfig.xpPerUnit, // Added xp_per_unit
      energy_cost_per_unit: habitConfig.energyCostPerUnit, // Added energy_cost_per_unit
      long_term_goal: habitConfig.targetGoal * (habitConfig.type === 'time' ? 365 * 60 : 365), // Example: 1 year goal in seconds or reps
      target_completion_date: oneYearDateString,
      current_daily_goal: habitConfig.targetGoal,
      momentum_level: habitConfig.momentum,
      lifetime_progress: 0, // Always start at 0
      last_goal_increase_date: today.toISOString().split('T')[0],
      is_frozen: false,
      max_goal_cap: null,
      last_plateau_start_date: today.toISOString().split('T')[0],
      plateau_days_required: 7, // Default plateau days
      completions_in_plateau: 0,
      is_fixed: ['teeth_brushing', 'medication'].includes(habitConfig.id), // Fixed for specific habits
      category: habitConfig.category,
      is_trial_mode: !['teeth_brushing', 'medication'].includes(habitConfig.id), // Trial mode for non-fixed habits
      frequency_per_week: 7, // Default to daily
      growth_phase: 'duration', // Default growth phase
      window_start: null,
      window_end: null,
      days_of_week: [0, 1, 2, 3, 4, 5, 6], // Default to all days
      auto_chunking: true,
      enable_chunks: false,
      num_chunks: 1,
      chunk_duration: habitConfig.targetGoal, // Default to full goal as one chunk
      is_visible: true, // Always visible if selected during onboarding
    }));

  if (habitsToUpsert.length > 0) {
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
    mutationFn: (selectedHabitKeys: string[]) => { // Changed mutationFn signature
      if (!session?.user?.id) throw new Error('User not authenticated');
      return initializeSelectedHabits(session.user.id, selectedHabitKeys); // Pass selected keys
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