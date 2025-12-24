"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError } from '@/utils/toast';
import { calculateLevel } from '@/utils/leveling';
import { isSameDay, subDays } from 'date-fns';
import { UserHabitRecord } from '@/types/habit';

interface LogHabitParams {
  habitKey: string;
  value: number;
  taskName: string;
  difficultyRating?: number;
  note?: string;
  capsuleIndex?: number; // New field for attribution
}

const logHabit = async ({ userId, habitKey, value, taskName, difficultyRating, note, capsuleIndex }: LogHabitParams & { userId: string }) => {
  // Fetch user_habit data to get dynamic properties
  const { data: userHabitDataResult, error: userHabitFetchError } = await supabase
    .from('user_habits')
    .select('*')
    .eq('user_id', userId)
    .eq('habit_key', habitKey)
    .single();

  if (!userHabitDataResult || userHabitFetchError) {
    throw userHabitFetchError || new Error(`Habit data not found for key: ${habitKey}`);
  }
  const userHabitData: UserHabitRecord = userHabitDataResult;

  const { data: profileData, error: profileFetchError } = await supabase
    .from('profiles')
    .select('tasks_completed_today, xp, level, timezone, neurodivergent_mode')
    .eq('id', userId)
    .single();

  if (profileFetchError) throw profileFetchError;
  const timezone = profileData.timezone || 'UTC';
  
  let xpBaseValue = value; 
  let lifetimeProgressIncrementValue = value; 
  let durationUsedForDB = null; 

  if (userHabitData.measurement_type === 'timer') {
    // Value is minutes, store as seconds
    durationUsedForDB = Math.round(value * 60); 
    lifetimeProgressIncrementValue = Math.round(value * 60); 
  } else {
    durationUsedForDB = null;
    lifetimeProgressIncrementValue = value; 
  }

  const xpPerUnit = userHabitData.xp_per_unit || (userHabitData.unit === 'min' ? 30 : 1);
  const energyCostPerUnit = userHabitData.energy_cost_per_unit ?? (userHabitData.unit === 'min' ? 6 : 0.5);

  const xpEarned = Math.round(xpBaseValue * xpPerUnit);
  const energyCost = Math.round(xpBaseValue * energyCostPerUnit);

  const { data: insertedTask, error: insertError } = await supabase.from('completedtasks').insert({
    user_id: userId, 
    original_source: habitKey, 
    task_name: taskName,
    duration_used: durationUsedForDB,
    xp_earned: xpEarned,
    energy_cost: energyCost, 
    difficulty_rating: difficultyRating || null,
    completed_at: new Date().toISOString(),
    note: note || null,
    capsule_index: capsuleIndex !== undefined ? capsuleIndex : null,
  }).select('id').single();

  if (insertError) throw insertError;

  await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId, p_habit_key: habitKey, p_increment_value: Math.round(lifetimeProgressIncrementValue),
  });

  const { data: completedTodayAfterLog } = await supabase.rpc('get_completed_tasks_today', { 
    p_user_id: userId, p_timezone: timezone 
  });
  
  // Calculate aggregate daily progress using seconds for timers
  let totalDailySeconds = 0;
  let totalDailyUnits = 0;
  
  (completedTodayAfterLog || []).filter((task: any) => task.original_source === habitKey).forEach((task: any) => {
    if (userHabitData.measurement_type === 'timer') {
      totalDailySeconds += (task.duration_used || 0);
    } else if (userHabitData.measurement_type === 'unit' || userHabitData.measurement_type === 'binary') {
      totalDailyUnits += (task.xp_earned || 0) / xpPerUnit;
    } else {
      totalDailyUnits += 1;
    }
  });

  const totalDailyProgressAfterLog = userHabitData.measurement_type === 'timer' 
    ? totalDailySeconds / 60 
    : totalDailyUnits;
  
  const surplus = totalDailyProgressAfterLog - userHabitData.current_daily_goal;
  const newCarryoverValue = Math.max(0, surplus);

  await supabase.from('user_habits').update({
    carryover_value: newCarryoverValue,
  }).eq('id', userHabitData.id);

  const isGoalMetAfterLog = totalDailyProgressAfterLog >= (userHabitData.current_daily_goal - 0.01);

  let newDailyGoal = userHabitData.current_daily_goal;
  let newFrequency = userHabitData.frequency_per_week;
  let newGrowthPhase = userHabitData.growth_phase;
  let newIsTrialMode = userHabitData.is_trial_mode;

  const todayDate = new Date();
  const todayDateString = todayDate.toISOString().split('T')[0];
  const plateauRequired = userHabitData.plateau_days_required; 
  let newCompletionsInPlateau = userHabitData.completions_in_plateau;
  let newLastPlateauStartDate = userHabitData.last_plateau_start_date;

  const lastPlateauDate = new Date(userHabitData.last_plateau_start_date);
  const isNewDayForPlateau = !isSameDay(todayDate, lastPlateauDate);

  if (isGoalMetAfterLog) {
    if (isNewDayForPlateau) {
      const yesterday = subDays(todayDate, 1); 
      const { data: completedYesterday } = await supabase.from('completedtasks')
        .select('id')
        .eq('user_id', userId)
        .eq('original_source', habitKey)
        .gte('completed_at', yesterday.toISOString())
        .lte('completed_at', todayDate.toISOString())
        .limit(1);
      
      const wasCompletedYesterday = completedYesterday && completedYesterday.length > 0;

      if (isSameDay(lastPlateauDate, yesterday) && wasCompletedYesterday) {
        newCompletionsInPlateau = userHabitData.completions_in_plateau + 1;
      } else {
        newCompletionsInPlateau = 1;
      }
      newLastPlateauStartDate = todayDateString;
    }
  } else if (isNewDayForPlateau) {
    newCompletionsInPlateau = 0;
    newLastPlateauStartDate = todayDateString;
  }

  if (userHabitData.is_trial_mode && newCompletionsInPlateau >= plateauRequired) {
    newIsTrialMode = false;
    showSuccess(`Congratulations! Your ${userHabitData.name} habit has transitioned from Trial Mode to Adaptive Growth!`);
  }

  if (!newIsTrialMode && !userHabitData.is_fixed && !userHabitData.is_frozen) { 
    if (newCompletionsInPlateau >= plateauRequired) {
      if (userHabitData.growth_phase === 'frequency' && userHabitData.frequency_per_week < 7) {
        newFrequency = userHabitData.frequency_per_week + 1;
        newGrowthPhase = 'duration';
        showSuccess(`Dynamic Growth: Frequency for ${userHabitData.name} increased to ${newFrequency}x per week!`);
      } else if (userHabitData.growth_phase === 'duration') {
        const growthType = userHabitData.growth_type || 'fixed';
        const growthValue = userHabitData.growth_value || 1;

        if (growthType === 'percentage') {
          const increment = userHabitData.current_daily_goal * (Number(growthValue) / 100);
          newDailyGoal = userHabitData.current_daily_goal + increment;
        } else {
          newDailyGoal = userHabitData.current_daily_goal + Number(growthValue);
        }

        if (userHabitData.max_goal_cap && newDailyGoal > userHabitData.max_goal_cap) {
          newDailyGoal = userHabitData.max_goal_cap;
          showSuccess(`Dynamic Growth: Daily goal for ${userHabitData.name} reached its cap at ${Math.round(newDailyGoal)} ${userHabitData.unit}!`);
        } else {
          showSuccess(`Dynamic Growth: Daily goal for ${userHabitData.name} increased to ${Math.round(newDailyGoal)} ${userHabitData.unit}!`);
        }
        
        newGrowthPhase = userHabitData.frequency_per_week < 7 ? 'frequency' : 'duration';
      }

      await supabase.from('user_habits').update({
        last_plateau_start_date: todayDateString,
        completions_in_plateau: 0, 
        last_goal_increase_date: todayDateString,
        current_daily_goal: Math.round(newDailyGoal),
        frequency_per_week: Math.round(newFrequency),
        growth_phase: newGrowthPhase,
        is_trial_mode: newIsTrialMode,
      }).eq('id', userHabitData.id);
    }
  } else {
    await supabase.from('user_habits').update({
      completions_in_plateau: Math.round(newCompletionsInPlateau),
      last_plateau_start_date: newLastPlateauStartDate,
      is_trial_mode: newIsTrialMode,
    }).eq('id', userHabitData.id);
  }

  const newXp = (profileData.xp || 0) + xpEarned;
  await supabase.from('profiles').update({
    last_active_at: new Date().toISOString(),
    tasks_completed_today: (profileData.tasks_completed_today || 0) + 1,
    xp: newXp,
    level: calculateLevel(newXp),
  }).eq('id', userId);

  return { success: true, taskName, xpEarned, completedTaskId: insertedTask.id };
};

const unlogHabit = async ({ userId, completedTaskId }: { userId: string, completedTaskId: string }) => {
  const { data: task, error: fetchTaskError } = await supabase
    .from('completedtasks')
    .select('*')
    .eq('id', completedTaskId)
    .eq('user_id', userId)
    .single();

  if (fetchTaskError || !task) throw fetchTaskError || new Error('Completed task not found');

  const { data: profileData } = await supabase
    .from('profiles')
    .select('timezone, xp, tasks_completed_today')
    .eq('id', userId)
    .single();

  const timezone = profileData?.timezone || 'UTC';

  const { data: userHabitDataResult } = await supabase
    .from('user_habits')
    .select('id, unit, xp_per_unit, current_daily_goal, completions_in_plateau, last_plateau_start_date, carryover_value, measurement_type')
    .eq('user_id', userId)
    .eq('habit_key', task.original_source)
    .single();

  if (!userHabitDataResult) throw new Error(`Habit data not found for key: ${task.original_source}`);
  const userHabitData = userHabitDataResult;
  const xpPerUnit = userHabitData.xp_per_unit || (userHabitData.unit === 'min' ? 30 : 1);

  let lifetimeProgressDecrementValue;
  if (userHabitData.measurement_type === 'timer') {
    lifetimeProgressDecrementValue = task.duration_used || 0;
  } else {
    lifetimeProgressDecrementValue = (task.xp_earned || 0) / xpPerUnit; 
  }

  await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId, p_habit_key: task.original_source, p_increment_value: -Math.round(lifetimeProgressDecrementValue),
  });

  if (profileData) {
    const newXp = Math.max(0, (profileData.xp || 0) - (task.xp_earned || 0));
    await supabase.from('profiles').update({
      xp: newXp,
      level: calculateLevel(newXp),
      tasks_completed_today: Math.max(0, (profileData.tasks_completed_today || 0) - 1)
    }).eq('id', userId);
  }

  await supabase.from('completedtasks').delete().eq('id', completedTaskId);

  const { data: completedTodayAfterUnlog } = await supabase.rpc('get_completed_tasks_today', { 
    p_user_id: userId, p_timezone: timezone 
  });
  
  let totalDailySeconds = 0;
  let totalDailyUnits = 0;

  (completedTodayAfterUnlog || []).filter((t: any) => t.original_source === task.original_source).forEach((t: any) => {
    if (userHabitData.measurement_type === 'timer') {
      totalDailySeconds += (t.duration_used || 0);
    } else if (userHabitData.measurement_type === 'unit' || userHabitData.measurement_type === 'binary') {
      totalDailyUnits += (t.xp_earned || 0) / xpPerUnit;
    } else {
      totalDailyUnits += 1;
    }
  });

  const totalDailyProgressAfterUnlog = userHabitData.measurement_type === 'timer' 
    ? totalDailySeconds / 60 
    : totalDailyUnits;

  const surplusAfterUnlog = totalDailyProgressAfterUnlog - userHabitData.current_daily_goal;
  const newCarryoverValueAfterUnlog = Math.max(0, surplusAfterUnlog);
  await supabase.from('user_habits').update({
    carryover_value: newCarryoverValueAfterUnlog,
  }).eq('id', userHabitData.id);

  const isGoalMetAfterUnlog = totalDailyProgressAfterUnlog >= (userHabitData.current_daily_goal - 0.01);

  if (!isGoalMetAfterUnlog && userHabitData.completions_in_plateau > 0) {
    await supabase.from('user_habits').update({
      completions_in_plateau: Math.round(userHabitData.completions_in_plateau - 1),
    }).eq('id', userHabitData.id);
  }

  return { success: true };
};

export const useHabitLog = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const logMutation = useMutation({
    mutationFn: (params: LogHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return logHabit({ ...params, userId: session.user.id });
    },
    onSuccess: async (data) => { // Added async here
      showSuccess(`${data.taskName} completed! +${data.xpEarned} XP`);
      await queryClient.refetchQueries({ queryKey: ['dashboardData', session?.user?.id] }); // Explicit refetch
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dailyHabitCompletion', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitHeatmapData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks', session?.user?.id] }); // Invalidate completedTasks
      return data.completedTaskId;
    },
    onError: (error) => {
      showError(`Failed: ${error.message}`);
    },
  });

  const unlogMutation = useMutation({
    mutationFn: (params: { completedTaskId: string }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return unlogHabit({ ...params, userId: session.user.id });
    },
    onSuccess: async () => { // Added async here
      showSuccess('Task uncompleted.');
      await queryClient.refetchQueries({ queryKey: ['dashboardData', session?.user?.id] }); // Explicit refetch
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dailyHabitCompletion', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitHeatmapData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks', session?.user?.id] }); // Invalidate completedTasks
    },
    onError: (error) => {
      showError(`Failed to uncomplete: ${error.message}`);
    },
  });

  return {
    mutate: logMutation.mutateAsync,
    isPending: logMutation.isPending,
    unlog: unlogMutation.mutate,
    isUnlogging: unlogMutation.isPending,
  };
};