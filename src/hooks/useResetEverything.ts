"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';

const resetUserEverything = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('reset-user-progress', { // Still calls the same function
    body: { userId },
  });

  if (error) throw error;
  return data;
};

export const useResetEverything = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return resetUserEverything(userId);
    },
    onSuccess: () => {
      showSuccess('Your account has been completely reset to a blank slate!');
      // Invalidate all relevant queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', userId] });
      queryClient.invalidateQueries({ queryKey: ['analyticsData', userId] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks', userId] });
      queryClient.invalidateQueries({ queryKey: ['habitHeatmapData', userId] });
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', userId] });
      queryClient.invalidateQueries({ queryKey: ['userHabitWizardTemp', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] }); // Invalidate profile data
    },
    onError: (error) => {
      showError(`Failed to reset everything: ${error.message}`);
    },
  });
};