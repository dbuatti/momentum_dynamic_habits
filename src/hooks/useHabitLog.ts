import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { initialHabits } from '@/lib/habit-data'; // Import initialHabits to get XP and energy cost per unit

interface LogHabitParams {
  habitKey: string;
  value: number; // reps for count, minutes for time
  taskName: string;
}

const logHabit = async ({ userId, habitKey, value, taskName }: LogHabitParams & { userId: string }) => {
  const habitConfig = initialHabits.find(h => h.id === habitKey);

  if (!habitConfig) {
    throw new Error(`Habit configuration not found for key: ${habitKey}`);
  }

  // Convert value to seconds for time-based habits if the unit is minutes in the log page
  const actualValue = habitConfig.type === 'time' && habitConfig.unit === 'min' ? value * 60 : value;

  const xpEarned = Math.round(actualValue * habitConfig.xpPerUnit);
  const energyCost = Math.round(actualValue * habitConfig.energyCostPerUnit);

  // 1. Insert into completedtasks
  const { error: insertError } = await supabase.from('completedtasks').insert({
    user_id: userId,
    original_source: habitKey,
    task_name: taskName,
    duration_used: habitConfig.type === 'time' ? actualValue : null, // Log actualValue (in seconds) for time-based
    xp_earned: xpEarned,
    energy_cost: energyCost,
  });

  if (insertError) throw insertError;

  // 2. Update lifetime_progress in user_habits using an RPC call for safety
    const { error: rpcError } = await supabase.rpc('increment_lifetime_progress', {
        p_user_id: userId,
        p_habit_key: habitKey,
        p_increment_value: actualValue, // Increment lifetime progress by actualValue (in seconds for time)
    });

  if (rpcError) throw rpcError;

  // 3. Update last_active_at in profiles
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileUpdateError) throw profileUpdateError;

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
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] }); // Invalidate journey data too
      navigate('/');
    },
    onError: (error) => {
      showError(`Failed to log habit: ${error.message}`);
    },
  });
};