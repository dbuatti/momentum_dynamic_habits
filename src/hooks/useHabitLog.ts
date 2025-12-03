import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

interface LogHabitParams {
  habitKey: string;
  value: number; // reps for count, minutes for time
  taskName: string;
}

const logHabit = async ({ userId, habitKey, value, taskName }: LogHabitParams & { userId: string }) => {
  // 1. Insert into completedtasks
  const { error: insertError } = await supabase.from('completedtasks').insert({
    user_id: userId,
    original_source: habitKey,
    task_name: taskName,
    // For count-based habits, we log reps in `xp_earned` for simplicity, and time in `duration_used`
    duration_used: habitKey === 'pushups' ? null : value,
    xp_earned: habitKey === 'pushups' ? value : 10,
    energy_cost: 5,
  });

  if (insertError) throw insertError;

  // 2. Update lifetime_progress in user_habits using an RPC call for safety
    const { error: rpcError } = await supabase.rpc('increment_lifetime_progress', {
        p_user_id: userId,
        p_habit_key: habitKey,
        p_increment_value: value,
    });

  if (rpcError) throw rpcError;

  return { success: true };
};

export const useHabitLog = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (params: LogHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return logHabit({ ...params, userId: session.user.id });
    },
    onSuccess: () => {
      showSuccess('Habit logged successfully!');
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
      navigate('/');
    },
    onError: (error) => {
      showError(`Failed to log habit: ${error.message}`);
    },
  });
};