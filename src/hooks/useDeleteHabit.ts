"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';

interface DeleteHabitParams {
  habitId: string;
  habitKey: string; // Also need habitKey to invalidate capsules
}

const deleteHabit = async ({ userId, habitId }: { userId: string; habitId: string }) => {
  const { error } = await supabase
    .from('user_habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', userId); // Ensure user can only delete their own habits

  if (error) throw error;
  return { success: true };
};

export const useDeleteHabit = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (params: DeleteHabitParams) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteHabit({ ...params, userId });
    },
    onSuccess: (_, variables) => {
      showSuccess('Habit deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', userId] });
      queryClient.invalidateQueries({ queryKey: ['analyticsData', userId] });
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId, new Date().toISOString().split('T')[0]] }); // Invalidate today's capsules
      queryClient.invalidateQueries({ queryKey: ['dailyHabitCompletion', userId, variables.habitKey] }); // Invalidate specific habit completion
      queryClient.invalidateQueries({ queryKey: ['habitHeatmapData', userId] });
    },
    onError: (error) => {
      showError(`Failed to delete habit: ${error.message}`);
    },
  });
};