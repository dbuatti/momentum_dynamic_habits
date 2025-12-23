import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { initialHabits } from '@/lib/habit-data';
import { calculateLevel } from '@/utils/leveling';
import { differenceInDays, startOfWeek, endOfWeek } from 'date-fns';

interface LogHabitParams {
  habitKey: string;
  value: number;
  taskName: string;
  difficultyRating?: number;
  note?: string;
}

const logHabit = async ({ userId, habitKey, value, taskName, difficultyRating, note }: LogHabitParams & { userId: string }) => {
  const habitConfig = initialHabits.find(h => h.id === habitKey);
  if (!habitConfig) throw new Error(`Habit configuration not found for key: ${habitKey}`);

  const { data: profileData, error: profileFetchError } = await supabase
    .from('profiles')
    .select('tasks_completed_today, xp, level, timezone, neurodivergent_mode')
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

  if (!userHabitData || userHabitFetchError) throw userHabitFetchError || new Error(`Habit data not found for key: ${habitKey}`);

  const actualValue = habitConfig.type === 'time' && habitConfig.unit === 'min' ? value * 60 : value;
  const xpEarned = Math.round(actualValue * habitConfig.xpPerUnit);
  const energyCost = Math.round(actualValue * habitConfig.energyCostPerUnit);

  const { error: insertError } = await supabase.from('completedtasks').insert({
    user_id: userId, original_source: habitKey, task_name: taskName,
    duration_used: habitConfig.type === 'time' ? actualValue : null,
    xp_earned: xpEarned, energy_cost: energyCost, difficulty_rating: difficultyRating || null,
    completed_at: new Date().toISOString(),
    note: note || null,
  });

  if (insertError) throw insertError;

  await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId, p_habit_key: habitKey, p_increment_value: actualValue,
  });

  const { data: completedToday } = await supabase.rpc('get_completed_tasks_today', { 
    p_user_id: userId, p_timezone: timezone 
  });

  let totalDailyProgress = 0;
  (completedToday || []).filter((task: any) => task.original_source === habitKey).forEach((task: any) => {
    if (habitConfig.type === 'time' && habitConfig.unit === 'min') totalDailyProgress += (task.duration_used || 0) / 60;
    else if (habitConfig.type === 'count') totalDailyProgress += (task.xp_earned || 0) / (habitConfig.xpPerUnit || 1);
  });

  // Adaptive logic
  const isFixedGoalHabit = userHabitData.is_fixed || ['teeth_brushing', 'medication'].includes(habitKey);
  let newDailyGoal = userHabitData.current_daily_goal;
  let newFrequency = userHabitData.frequency_per_week;
  let newGrowthPhase = userHabitData.growth_phase;
  
  const todayDate = new Date();
  const todayDateString = todayDate.toISOString().split('T')[0];
  const daysInPlateau = differenceInDays(todayDate, new Date(userHabitData.last_plateau_start_date));
  const isHabitCompletedToday = totalDailyProgress >= userHabitData.current_daily_goal;
  const newCompletionsInPlateau = userHabitData.completions_in_plateau + (isHabitCompletedToday ? 1 : 0);

  // Growth mode logic
  if (!isFixedGoalHabit && !userHabitData.is_frozen && !userHabitData.is_trial_mode) {
    const plateauRequired = profileData.neurodivergent_mode ? 14 : 7; // Longer for growth mode
    
    if (daysInPlateau >= plateauRequired) {
      const completionRate = newCompletionsInPlateau / (daysInPlateau + 1);
      
      if (completionRate >= 0.8) {
        if (userHabitData.growth_phase === 'frequency' && userHabitData.frequency_per_week < 7) {
          newFrequency = userHabitData.frequency_per_week + 1;
          newGrowthPhase = 'duration';
          showSuccess(`Dynamic Growth: Frequency increased to ${newFrequency}x per week!`);
        } else if (userHabitData.growth_phase === 'duration') {
          if (habitConfig.type === 'time') newDailyGoal = userHabitData.current_daily_goal + 5;
          else newDailyGoal = userHabitData.current_daily_goal + 1;
          
          if (!userHabitData.max_goal_cap || newDailyGoal <= userHabitData.max_goal_cap) {
            newGrowthPhase = userHabitData.frequency_per_week < 7 ? 'frequency' : 'duration';
            showSuccess(`Dynamic Growth: Duration increased to ${newDailyGoal} ${habitConfig.unit}!`);
          } else {
            newDailyGoal = userHabitData.max_goal_cap;
          }
        }

        await supabase.from('user_habits').update({
          last_plateau_start_date: todayDateString,
          completions_in_plateau: 0,
          last_goal_increase_date: todayDateString,
          current_daily_goal: newDailyGoal,
          frequency_per_week: newFrequency,
          growth_phase: newGrowthPhase,
        }).eq('id', userHabitData.id);
      }
    }
  }

  // Basic update if not growing
  if (isHabitCompletedToday) {
     await supabase.from('user_habits').update({
      completions_in_plateau: newCompletionsInPlateau,
    }).eq('id', userHabitData.id);
  }

  const newXp = (profileData.xp || 0) + xpEarned;
  await supabase.from('profiles').update({
    last_active_at: new Date().toISOString(),
    tasks_completed_today: (profileData.tasks_completed_today || 0) + 1,
    xp: newXp,
    level: calculateLevel(newXp),
  }).eq('id', userId);

  return { success: true };
};

const unlogHabit = async ({ userId, habitKey, taskName }: { userId: string, habitKey: string, taskName: string }) => {
  const { data: task, error: findError } = await supabase
    .from('completedtasks')
    .select('*')
    .eq('user_id', userId)
    .eq('original_source', habitKey)
    .eq('task_name', taskName)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !task) throw findError || new Error('Task not found');

  const habitConfig = initialHabits.find(h => h.id === habitKey);
  const valueToRevert = habitConfig?.type === 'time' ? (task.duration_used || 0) : task.xp_earned;
  
  await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId, p_habit_key: habitKey, p_increment_value: -valueToRevert,
  });

  const { data: profile } = await supabase.from('profiles').select('xp, tasks_completed_today').eq('id', userId).single();
  if (profile) {
    const newXp = Math.max(0, (profile.xp || 0) - (task.xp_earned || 0));
    await supabase.from('profiles').update({
      xp: newXp,
      level: calculateLevel(newXp),
      tasks_completed_today: Math.max(0, (profile.tasks_completed_today || 0) - 1)
    }).eq('id', userId);
  }

  const { error: deleteError } = await supabase.from('completedtasks').delete().eq('id', task.id);
  if (deleteError) throw deleteError;

  return { success: true };
};

export const useHabitLog = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logMutation = useMutation({
    mutationFn: (params: LogHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return logHabit({ ...params, userId: session.user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
    },
    onError: (error) => showError(`Failed: ${error.message}`),
  });

  const unlogMutation = useMutation({
    mutationFn: (params: { habitKey: string, taskName: string }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return unlogHabit({ ...params, userId: session.user.id });
    },
    onSuccess: () => {
      showSuccess('Task uncompleted.');
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
    },
    onError: (error) => showError(`Failed to uncomplete: ${error.message}`),
  });

  return {
    mutate: logMutation.mutate,
    isPending: logMutation.isPending,
    unlog: unlogMutation.mutate,
    isUnlogging: unlogMutation.isPending,
  };
};