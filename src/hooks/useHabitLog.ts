import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { initialHabits } from '@/lib/habit-data';
import { calculateLevel } from '@/utils/leveling'; // Import calculateLevel

interface LogHabitParams {
  habitKey: string;
  value: number;
  taskName: string;
}

const logHabit = async ({ userId, habitKey, value, taskName }: LogHabitParams & { userId: string }) => {
  const habitConfig = initialHabits.find(h => h.id === habitKey);
  if (!habitConfig) {
    throw new Error(`Habit configuration not found for key: ${habitKey}`);
  }

  const actualValue = habitConfig.type === 'time' && habitConfig.unit === 'min' ? value * 60 : value;
  const xpEarned = Math.round(actualValue * habitConfig.xpPerUnit);
  const energyCost = Math.round(actualValue * habitConfig.energyCostPerUnit);

  const { error: insertError } = await supabase.from('completedtasks').insert({
    user_id: userId,
    original_source: habitKey,
    task_name: taskName,
    duration_used: habitConfig.type === 'time' ? actualValue : null,
    xp_earned: xpEarned,
    energy_cost: energyCost,
  });

  if (insertError) throw insertError;

  const { error: rpcError } = await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId,
    p_habit_key: habitKey,
    p_increment_value: actualValue,
  });

  if (rpcError) throw rpcError;

  const { data: profileData, error: profileFetchError } = await supabase
    .from('profiles')
    .select('tasks_completed_today, xp, level')
    .eq('id', userId)
    .single();

  if (profileFetchError) throw profileFetchError;

  const { data: userHabitData, error: userHabitFetchError } = await supabase
    .from('user_habits')
    .select('current_daily_goal, momentum_level, long_term_goal') // Added long_term_goal
    .eq('user_id', userId)
    .eq('habit_key', habitKey)
    .single();

  if (userHabitFetchError) throw userHabitFetchError;

  let newDailyGoal = userHabitData.current_daily_goal;
  let newMomentumLevel = userHabitData.momentum_level;
  let newXp = (profileData.xp || 0) + xpEarned;
  let newLevel = calculateLevel(newXp); // Calculate new level based on new XP

  const goalMet = (habitConfig.type === 'time' && value >= userHabitData.current_daily_goal) || 
                  (habitConfig.type === 'count' && value >= userHabitData.current_daily_goal);

  if (goalMet) {
    // Increase goal slightly, improve momentum
    newDailyGoal = Math.min(userHabitData.current_daily_goal + 1, userHabitData.long_term_goal); // Use user's long_term_goal
    if (newMomentumLevel === 'Struggling') newMomentumLevel = 'Building';
    else if (newMomentumLevel === 'Building') newMomentumLevel = 'Strong';
    else if (newMomentumLevel === 'Strong') newMomentumLevel = 'Crushing';
  } else {
    newDailyGoal = Math.max(1, userHabitData.current_daily_goal - 1);
    if (newMomentumLevel === 'Crushing') newMomentumLevel = 'Strong';
    else if (newMomentumLevel === 'Strong') newMomentumLevel = 'Building';
    else if (newMomentumLevel === 'Building') newMomentumLevel = 'Struggling';
  }

  const { error: habitUpdateError } = await supabase
    .from('user_habits')
    .update({
      current_daily_goal: newDailyGoal,
      momentum_level: newMomentumLevel,
    })
    .eq('user_id', userId)
    .eq('habit_key', habitKey);

  if (habitUpdateError) throw habitUpdateError;

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      last_active_at: new Date().toISOString(),
      tasks_completed_today: (profileData.tasks_completed_today || 0) + 1,
      xp: newXp,
      level: newLevel, // Update the level here
    })
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
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      navigate('/');
    },
    onError: (error) => {
      showError(`Failed to log habit: ${error.message}`);
    },
  });
};