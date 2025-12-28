"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { UserHabitRecord } from '@/types/habit';

interface UpdateHabitParams {
  habitId: string;
  updates: Partial<UserHabitRecord>;
  successMessage?: string;
  errorMessage?: string;
}

const updateHabit = async ({ userId, habitId, updates }: UpdateHabitParams & { userId: string }) => {
  const roundedUpdates: Partial<UserHabitRecord> = { ...updates };

  // Explicitly round integer fields if they are present in updates
  if (typeof roundedUpdates.current_daily_goal === 'number') {
    roundedUpdates.current_daily_goal = Math.round(roundedUpdates.current_daily_goal);
  }
  if (typeof roundedUpdates.frequency_per_week === 'number') {
    roundedUpdates.frequency_per_week = Math.round(roundedUpdates.frequency_per_week);
  }
  if (typeof roundedUpdates.xp_per_unit === 'number') {
    roundedUpdates.xp_per_unit = Math.round(roundedUpdates.xp_per_unit);
  }
  if (typeof roundedUpdates.plateau_days_required === 'number') {
    roundedUpdates.plateau_days_required = Math.round(roundedUpdates.plateau_days_required);
  }
  if (typeof roundedUpdates.num_chunks === 'number') {
    roundedUpdates.num_chunks = Math.round(roundedUpdates.num_chunks);
  }
  if (typeof roundedUpdates.long_term_goal === 'number') {
    roundedUpdates.long_term_goal = Math.round(roundedUpdates.long_term_goal);
  }
  if (typeof roundedUpdates.lifetime_progress === 'number') {
    roundedUpdates.lifetime_progress = Math.round(roundedUpdates.lifetime_progress);
  }
  if (typeof roundedUpdates.completions_in_plateau === 'number') {
    roundedUpdates.completions_in_plateau = Math.round(roundedUpdates.completions_in_plateau);
  }
  if (typeof roundedUpdates.weekly_session_min_duration === 'number') {
    roundedUpdates.weekly_session_min_duration = Math.round(roundedUpdates.weekly_session_min_duration);
  }
  // NEW: Round weekly goal fields
  if (typeof roundedUpdates.weekly_goal_target === 'number') {
    roundedUpdates.weekly_goal_target = Math.round(roundedUpdates.weekly_goal_target);
  }

  const { error } = await supabase
    .from('user_habits')
    .update(roundedUpdates) // Use rounded updates
    .eq('id', habitId)
    .eq('user_id', userId); // Ensure user can only update their own habits

  if (error) throw error;
  return { success: true };
};

export const useUpdateHabit = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return updateHabit({ ...params, userId: session.user.id });
    },
    onSuccess: (_, variables) => {
      showSuccess(variables.successMessage || 'Habit updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['analyticsData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
    },
    onError: (error, variables) => {
      showError(variables.errorMessage || `Failed to update habit: ${error.message}`);
    },
  });
};