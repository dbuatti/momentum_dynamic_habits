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
  const { error } = await supabase
    .from('user_habits')
    .update(updates)
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