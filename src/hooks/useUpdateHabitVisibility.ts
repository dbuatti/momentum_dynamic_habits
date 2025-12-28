"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';

interface UpdateVisibilityParams {
  habitKey: string;
  isVisible: boolean;
}

const updateHabitVisibility = async ({ userId, habitKey, isVisible }: UpdateVisibilityParams & { userId: string }) => {
  const { error } = await supabase
    .from('user_habits')
    .update({ is_visible: isVisible })
    .eq('user_id', userId)
    .eq('habit_key', habitKey);

  if (error) throw error;
  return { success: true };
};

export const useUpdateHabitVisibility = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateVisibilityParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return updateHabitVisibility({ ...params, userId: session.user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      // No success toast here, as it might be called many times during onboarding
    },
    onError: (error) => {
      showError(`Failed to update habit visibility: ${error.message}`);
    },
  });
};