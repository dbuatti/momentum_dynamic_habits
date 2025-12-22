import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { initialHabits } from '@/lib/habit-data';
import { calculateLevel } from '@/utils/leveling';
import { differenceInDays } from 'date-fns';

interface LogHabitParams {
  habitKey: string;
  value: number;
  taskName: string;
  difficultyRating?: number;
}

const logHabit = async ({ userId, habitKey, value, taskName, difficultyRating }: LogHabitParams & { userId: string }) => {
  const habitConfig = initialHabits.find(h => h.id === habitKey);
  if (!habitConfig) {
    throw new Error(`Habit configuration not found for key: ${habitKey}`);
  }

  const { data: profileData, error: profileFetchError } = await supabase
    .from('profiles')
    .select('tasks_completed_today, xp, level, timezone')
    .eq('id', userId)
    .single();

  if (profileFetchError) throw profileFetchError;
  const timezone = profileData.timezone || 'UTC';
  
  const { data: userHabitData, error: userHabitFetchError } = await supabase
    .from('user_habits')
    .select('*')
    .eq('user_id', userId)
    .eq('habit_key', habitKey)
    .single();

  if (!userHabitData || userHabitFetchError) {
    throw userHabitFetchError || new Error(`Habit data not found for key: ${habitKey}`);
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
    difficulty_rating: difficultyRating || null,
    completed_at: new Date().toISOString(),
  });

  if (insertError) throw insertError;

  await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId,
    p_habit_key: habitKey,
    p_increment_value: actualValue,
  });

  const { data: completedToday } = await supabase.rpc('get_completed_tasks_today', { 
    p_user_id: userId, 
    p_timezone: timezone 
  });

  let totalDailyProgress = 0;
  (completedToday || []).filter((task: any) => task.original_source === habitKey).forEach((task: any) => {
    if (habitConfig.type === 'time' && habitConfig.unit === 'min') {
      totalDailyProgress += (task.duration_used || 0) / 60;
    } else if (habitConfig.type === 'count') {
      totalDailyProgress += (task.xp_earned || 0) / (habitConfig.xpPerUnit || 1);
    }
  });

  // Algorithm Refinement Logic
  const isFixedGoalHabit = ['teeth_brushing', 'medication'].includes(habitKey);
  let newDailyGoal = userHabitData.current_daily_goal;
  let newMomentumLevel = userHabitData.momentum_level;
  let goalIncreased = false;
  let goalDecreased = false;
  
  const todayDate = new Date();
  const todayDateString = todayDate.toISOString().split('T')[0];
  const daysInPlateau = differenceInDays(todayDate, new Date(userHabitData.last_plateau_start_date));
  
  // Track completions in plateau
  const isHabitCompletedToday = totalDailyProgress >= userHabitData.current_daily_goal;
  const newCompletionsInPlateau = userHabitData.completions_in_plateau + (isHabitCompletedToday ? 1 : 0);

  if (!isFixedGoalHabit && !userHabitData.is_frozen) {
    // 1. Check if plateau period is over
    if (daysInPlateau >= userHabitData.plateau_days_required) {
      const completionRate = newCompletionsInPlateau / (daysInPlateau + 1);
      
      // 2. Only increase if 80% consistency reached
      if (completionRate >= 0.8) {
        if (habitConfig.type === 'time') {
          // 15-second increment (0.25 min)
          newDailyGoal = parseFloat((userHabitData.current_daily_goal + 0.25).toFixed(2));
        } else {
          // 1 rep increment
          newDailyGoal = userHabitData.current_daily_goal + 1;
        }
        
        // Respect Max Cap
        if (userHabitData.max_goal_cap && newDailyGoal > userHabitData.max_goal_cap) {
          newDailyGoal = userHabitData.max_goal_cap;
        } else {
          goalIncreased = true;
          // Reset plateau tracking
          await supabase.from('user_habits').update({
            last_plateau_start_date: todayDateString,
            completions_in_plateau: 0,
            last_goal_increase_date: todayDateString
          }).eq('id', userHabitData.id);
        }
      }
    }
    
    // Recovery Logic: If struggling (last 3 days < 3 difficulty stars or missing days)
    if (!isHabitCompletedToday && userHabitData.current_daily_goal > 1) {
       // Simple struggling check: reduce goal slightly if momentum drops to 'Struggling'
       if (newMomentumLevel === 'Struggling') {
         newDailyGoal = Math.max(1, userHabitData.current_daily_goal - (habitConfig.type === 'time' ? 0.25 : 1));
         goalDecreased = true;
       }
    }
  }

  // Update Habit Record
  await supabase.from('user_habits').update({
    current_daily_goal: newDailyGoal,
    completions_in_plateau: isHabitCompletedToday ? newCompletionsInPlateau : userHabitData.completions_in_plateau,
    momentum_level: isHabitCompletedToday ? 
      (newMomentumLevel === 'Struggling' ? 'Building' : newMomentumLevel) : 
      (newMomentumLevel === 'Building' ? 'Struggling' : newMomentumLevel)
  }).eq('id', userHabitData.id);

  // Profile Updates
  const newXp = (profileData.xp || 0) + xpEarned;
  await supabase.from('profiles').update({
    last_active_at: new Date().toISOString(),
    tasks_completed_today: (profileData.tasks_completed_today || 0) + 1,
    xp: newXp,
    level: calculateLevel(newXp),
  }).eq('id', userId);

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
      setTimeout(() => {
        let message = 'Habit logged successfully!';
        if (data.goalIncreased) message += ' Goal increased after consistency plateau!';
        if (data.goalDecreased) message += ' Goal reduced to help you recover.';
        
        showSuccess(message);
        queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
        queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
        queryClient.invalidateQueries({ queryKey: ['dailyHabitCompletion', session?.user?.id, variables.habitKey] });
        navigate('/');
      }, 750); 
    },
    onError: (error) => {
      showError(`Failed to log habit: ${error.message}`);
    },
  });
};