import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { initialHabits } from '@/lib/habit-data';
import { calculateLevel } from '@/utils/leveling';

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

  // 1. Fetch Profile first to get Timezone and current XP/Level
  const { data: profileData, error: profileFetchError } = await supabase
    .from('profiles')
    .select('tasks_completed_today, xp, level, timezone')
    .eq('id', userId)
    .single();

  if (profileFetchError) throw profileFetchError;
  const timezone = profileData.timezone || 'UTC';
  
  // 2. Fetch current habit data before logging
  const { data: userHabitData, error: userHabitFetchError } = await supabase
    .from('user_habits')
    .select('current_daily_goal, momentum_level, long_term_goal, last_goal_increase_date')
    .eq('user_id', userId)
    .eq('habit_key', habitKey)
    .single();

  if (userHabitData === null || userHabitFetchError) {
    throw userHabitFetchError || new Error(`Habit data not found for key: ${habitKey}`);
  }

  // 3. Calculate values for logging
  // For time-based habits, convert minutes (value) to seconds (actualValue)
  const actualValue = habitConfig.type === 'time' && habitConfig.unit === 'min' ? value * 60 : value;
  const xpEarned = Math.round(actualValue * habitConfig.xpPerUnit);
  const energyCost = Math.round(actualValue * habitConfig.energyCostPerUnit);

  // 4. Insert completed task, explicitly setting completed_at to NOW
  const { error: insertError } = await supabase.from('completedtasks').insert({
    user_id: userId,
    original_source: habitKey,
    task_name: taskName,
    duration_used: habitConfig.type === 'time' ? actualValue : null,
    xp_earned: xpEarned,
    energy_cost: energyCost,
    completed_at: new Date().toISOString(), // Explicitly set to current time
  });

  if (insertError) throw insertError;

  // 5. Increment lifetime progress
  const { error: rpcError } = await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId,
    p_habit_key: habitKey,
    p_increment_value: actualValue,
  });

  if (rpcError) throw rpcError;

  // 6. Recalculate total daily progress *after* the new task is logged
  const { data: completedToday, error: completedTodayError } = await supabase.rpc('get_completed_tasks_today', { 
    p_user_id: userId, 
    p_timezone: timezone 
  });
  
  if (completedTodayError) throw completedTodayError;

  let totalDailyProgress = 0;
  (completedToday || []).filter((task: any) => task.original_source === habitKey).forEach((task: any) => {
    let progress = 0;
    if (habitConfig.type === 'time' && habitConfig.unit === 'min') {
      progress = (task.duration_used || 0) / 60; // Convert seconds to minutes
    } else if (habitConfig.type === 'count') {
      const xpPerUnit = habitConfig.xpPerUnit || 1;
      progress = (task.xp_earned || 0) / xpPerUnit;
    }
    totalDailyProgress += progress;
  });

  // 7. Adaptive Goal Logic
  const fixedGoalHabits = ['teeth_brushing', 'medication', 'housework', 'projectwork'];
  const isFixedGoalHabit = fixedGoalHabits.includes(habitKey);

  let newDailyGoal = userHabitData.current_daily_goal;
  let newMomentumLevel = userHabitData.momentum_level;
  const oldDailyGoal = userHabitData.current_daily_goal;
  const oldMomentumLevel = userHabitData.momentum_level;
  let goalIncreased = false;
  let goalDecreased = false;
  
  const todayDateString = new Date().toISOString().split('T')[0];
  const lastIncreaseDateString = userHabitData.last_goal_increase_date;
  const alreadyIncreasedToday = lastIncreaseDateString === todayDateString;

  // Only adjust goals for non-fixed habits
  if (!isFixedGoalHabit) {
    const goalMet = totalDailyProgress >= oldDailyGoal;

    if (goalMet) {
      // A. Goal Met: Increase goal (max once per day) and improve momentum
      if (!alreadyIncreasedToday) {
        const potentialNewGoal = Math.min(oldDailyGoal + 1, userHabitData.long_term_goal);
        if (potentialNewGoal > oldDailyGoal) {
          newDailyGoal = potentialNewGoal;
          goalIncreased = true;
        }
        
        if (newMomentumLevel === 'Struggling') newMomentumLevel = 'Building';
        else if (newMomentumLevel === 'Building') newMomentumLevel = 'Strong';
        else if (newMomentumLevel === 'Strong') newMomentumLevel = 'Crushing';
      }
    } else {
      // B. Goal Not Met: Degrade momentum and potentially decrease goal
      
      // Momentum Degradation
      if (newMomentumLevel === 'Crushing') newMomentumLevel = 'Strong';
      else if (newMomentumLevel === 'Strong') newMomentumLevel = 'Building';
      else if (newMomentumLevel === 'Building') newMomentumLevel = 'Struggling';
      
      // Goal Decrease (Only if struggling and goal is > 1)
      if (newMomentumLevel === 'Struggling' && oldDailyGoal > 1) {
        newDailyGoal = oldDailyGoal - 1;
        goalDecreased = true;
      }
    }
  }
  
  console.log(`Habit Log: ${habitKey}. Progress: ${totalDailyProgress}. Old Goal: ${oldDailyGoal}. New Goal: ${newDailyGoal}. Goal Increased: ${goalIncreased}. Goal Decreased: ${goalDecreased}. New Momentum: ${newMomentumLevel}`);

  // 8. Update habit data (goal, momentum, and last_goal_increase_date if increased)
  if (!isFixedGoalHabit && (goalIncreased || goalDecreased || newMomentumLevel !== oldMomentumLevel)) {
    const updates: Record<string, any> = {
      current_daily_goal: newDailyGoal,
      momentum_level: newMomentumLevel,
    };
    
    if (goalIncreased) {
      updates.last_goal_increase_date = todayDateString;
    }
    
    const { error: habitUpdateError } = await supabase
      .from('user_habits')
      .update(updates)
      .eq('user_id', userId)
      .eq('habit_key', habitKey);

    if (habitUpdateError) throw habitUpdateError;
  }

  // 9. Update profile data (XP, level, tasks completed today)
  let newXp = (profileData.xp || 0) + xpEarned;
  let newLevel = calculateLevel(newXp);

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      last_active_at: new Date().toISOString(),
      tasks_completed_today: (profileData.tasks_completed_today || 0) + 1,
      xp: newXp,
      level: newLevel,
    })
    .eq('id', userId);

  if (profileUpdateError) throw profileUpdateError;

  return { success: true, goalIncreased, goalDecreased };
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
    onSuccess: (data, variables) => {
      // Increase delay to 750ms to ensure database write propagation before invalidating cache and navigating.
      setTimeout(() => {
        let message = 'Habit logged successfully!';
        if (data.goalIncreased) {
          message = 'Habit logged successfully! Daily goal increased!';
        } else if (data.goalDecreased) {
          message = 'Habit logged successfully! Daily goal decreased to keep things manageable.';
        }
        
        showSuccess(message);
        queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
        queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
        // Invalidate the specific daily completion check for this habit
        queryClient.invalidateQueries({ queryKey: ['dailyHabitCompletion', session?.user?.id, variables.habitKey] });
        navigate('/');
      }, 750); 
    },
    onError: (error) => {
      showError(`Failed to log habit: ${error.message}`);
    },
  });
};