"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';

const resetUserProgress = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('reset-user-progress', {
    body: { userId }, // The edge function expects the user ID in the body
  });

  if (error) throw error;
  return data;
};

export const useResetProgress = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return resetUserProgress(userId);
    },
    onSuccess: () => {
      showSuccess('Your progress has been reset successfully!');
      // Invalidate all relevant queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', userId] });
      queryClient.invalidateQueries({ queryKey: ['analyticsData', userId] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks', userId] });
      queryClient.invalidateQueries({ queryKey: ['habitHeatmapData', userId] });
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId] });
      queryClient.invalidateQueries({ queryKey: ['userHabitWizardTemp', userId] });
    },
    onError: (error) => {
      showError(`Failed to reset progress: ${error.message}`);
    },
  });
};