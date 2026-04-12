"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';

const resetUserExperience = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('reset-user-experience', {
    body: { userId },
  });

  if (error) throw error;
  return data;
};

export const useResetExperience = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return resetUserExperience(userId);
    },
    onSuccess: () => {
      showSuccess('Your experience (XP, level, streaks) has been reset!');
      // Invalidate relevant queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', userId] });
      queryClient.invalidateQueries({ queryKey: ['analyticsData', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] }); // Invalidate profile data
    },
    onError: (error) => {
      showError(`Failed to reset experience: ${error.message}`);
    },
  });
};