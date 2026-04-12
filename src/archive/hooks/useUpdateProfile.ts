import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError } from '@/utils/toast';

interface UpdateProfileParams {
  [key: string]: any; // Allows updating any profile field
}

const updateProfile = async ({ userId, updates }: { userId: string; updates: UpdateProfileParams }) => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
  return { success: true };
};

export const useUpdateProfile = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: UpdateProfileParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return updateProfile({ userId: session.user.id, updates });
    },
    onSuccess: () => {
      showSuccess('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] }); // Invalidate dashboard data too if profile changes affect it
    },
    onError: (error) => {
      showError(`Failed to update profile: ${error.message}`);
    },
  });
};