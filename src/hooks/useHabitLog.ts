import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { initialHabits } from '@/lib/habit-data'; // Import initialHabits to get XP and energy cost per unit
import { startOfDay } from 'date-fns';

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

  // 3. Fetch current profile and habit data for adaptive logic
  const { data: profileData, error: profileFetchError } = await supabase
    .from('profiles')
    .select('tasks_completed_today, xp, level')
    .eq('id', userId)
    .single();

  if (profileFetchError) throw profileFetchError;

  const { data: userHabitData, error: userHabitFetchError } = await supabase
    .from('user_habits')
    .select('current_daily_goal, momentum_level')
    .eq('user_id', userId)
    .eq('habit_key', habitKey)
    .single();

  if (userHabitFetchError) throw userHabitFetchError;

  let newDailyGoal = userHabitData.current_daily_goal;
  let newMomentumLevel = userHabitData.momentum_level;
  let newXp = (profileData.xp || 0) + xpEarned;
  let newLevel = profileData.level;

  // Simple adaptive logic for current_daily_goal and momentum_level
  const goalMet = (habitConfig.type === 'time' && value >= userHabitData.current_daily_goal) ||
                  (habitConfig.type === 'count' && value >= userHabitData.current_daily_goal);

  if (goalMet) {
    // Increase goal slightly, improve momentum
    newDailyGoal = Math.min(userHabitData.current_daily_goal + 1, habitConfig.longTermGoal); // Cap at long-term goal
    if (newMomentumLevel === 'Struggling') newMomentumLevel = 'Building';
    else if (newMomentumLevel === 'Building') newMomentumLevel = 'Strong';
    else if (newMomentumLevel === 'Strong') newMomentumLevel = 'Crushing';
  } else {
    // Decrease goal slightly, worsen momentum
    newDailyGoal = Math.max(1, userHabitData.current_daily_goal - 1); // Minimum goal of 1
    if (newMomentumLevel === 'Crushing') newMomentumLevel = 'Strong';
    else if (newMomentumLevel === 'Strong') newMomentumLevel = 'Building';
    else if (newMomentumLevel === 'Building') newMomentumLevel = 'Struggling';
  }

  // Update user_habits with new goal and momentum
  const { error: habitUpdateError } = await supabase
    .from('user_habits')
    .update({
      current_daily_goal: newDailyGoal,
      momentum_level: newMomentumLevel,
    })
    .eq('user_id', userId)
    .eq('habit_key', habitKey);

  if (habitUpdateError) throw habitUpdateError;

  // Update profile: tasks_completed_today, xp, and level
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      last_active_at: new Date().toISOString(),
      tasks_completed_today: (profileData.tasks_completed_today || 0) + 1,
      xp: newXp,
      level: newLevel, // Level calculation will be handled by a separate function or trigger if needed
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
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] }); // Invalidate journey data too
      navigate('/');
    },
    onError: (error) => {
      showError(`Failed to log habit: ${error.message}`);
    },
  });
};