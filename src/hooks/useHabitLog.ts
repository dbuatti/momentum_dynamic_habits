"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError } from '@/utils/toast';
import { calculateHabitLevel, getXpGainPerCompletion } from '@/utils/habit-leveling';
import { UserHabitRecord } from '@/types/habit';
import { getTodayDateString } from '@/utils/time-utils';

interface LogHabitParams {
  habitKey: string;
  value: number;
  taskName: string;
  difficultyRating?: number;
  note?: string;
  capsuleIndex?: number;
}

const getDayBoundaries = async (userId: string, dateString: string) => {
  const { data, error } = await supabase.rpc('get_day_boundaries', {
    p_user_id: userId,
    p_target_date: dateString,
  });
  if (error) throw error;
  return data[0];
};

const checkHabitCompletionOnDay = async (userId: string, habitKey: string, date: Date, userHabitData: UserHabitRecord, timezone: string): Promise<boolean> => {
  const dateString = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  
  const boundaries = await getDayBoundaries(userId, dateString);
  if (!boundaries) return false;

  const { data: completedTasksOnDay, error: fetchError } = await supabase
    .from('completedtasks')
    .select('duration_used, xp_earned')
    .eq('user_id', userId)
    .eq('original_source', habitKey)
    .gte('completed_at', boundaries.start_time)
    .lt('completed_at', boundaries.end_time);

  if (fetchError || !completedTasksOnDay || completedTasksOnDay.length === 0) return false;

  if (userHabitData.complete_on_finish) {
    return completedTasksOnDay.length >= 1;
  } 
  
  const isWeeklyAnchor = userHabitData.category === 'anchor' && userHabitData.frequency_per_week === 1;
  const xpPerUnit = userHabitData.xp_per_unit || (userHabitData.unit === 'min' ? 30 : 1);

  if (isWeeklyAnchor && userHabitData.measurement_type === 'timer') {
    const minDuration = userHabitData.weekly_session_min_duration || 10;
    return completedTasksOnDay.some(task => (task.duration_used || 0) / 60 >= minDuration);
  } else {
    let totalProgressOnDay = 0;
    completedTasksOnDay.forEach(task => {
      if (userHabitData.measurement_type === 'timer') {
        totalProgressOnDay += (task.duration_used || 0) / 60;
      } else if (userHabitData.measurement_type === 'unit' || userHabitData.measurement_type === 'binary') {
        totalProgressOnDay += (task.xp_earned || 0) / xpPerUnit;
      } else {
        totalProgressOnDay += 1;
      }
    });
    const threshold = userHabitData.measurement_type === 'timer' ? 0.1 : 0.01;
    return totalProgressOnDay >= (userHabitData.current_daily_goal - threshold);
  }
};

const logHabit = async ({ userId, habitKey, value, taskName, difficultyRating, note, capsuleIndex }: LogHabitParams & { userId: string }) => {
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
    .select('tasks_completed_today, timezone, neurodivergent_mode, day_rollover_hour')
    .eq('id', userId)
    .single();

  if (profileFetchError) throw profileFetchError;
  const timezone = profileData.timezone || 'UTC';
  
  const xpBaseValue = value; 
  let lifetimeProgressIncrementValue;
  let durationUsedForDB = null; 

  if (userHabitData.measurement_type === 'timer') {
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

  const wasCompletedTodayBeforeLog = await checkHabitCompletionOnDay(userId, habitKey, new Date(), userHabitData, timezone);

  // Calculate Mastery XP based on effort (value) and unit
  const habitXpEarned = getXpGainPerCompletion(value, userHabitData.unit, wasCompletedTodayBeforeLog);

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
    habit_xp_earned: habitXpEarned, // Store the effort-based XP
  }).select('id').single();

  if (insertError) throw insertError;

  await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId, p_habit_key: habitKey, p_increment_value: Math.round(lifetimeProgressIncrementValue),
  });

  const isWeeklyAnchor = userHabitData.category === 'anchor' && userHabitData.frequency_per_week === 1;
  let isGoalMetAfterLog = false;
  let totalDailyProgressAfterLog = 0;

  if (userHabitData.complete_on_finish) {
    isGoalMetAfterLog = true;
    totalDailyProgressAfterLog = userHabitData.current_daily_goal;
  } else if (isWeeklyAnchor && userHabitData.measurement_type === 'timer') {
    const minDuration = userHabitData.weekly_session_min_duration || 10;
    if (value >= minDuration) {
      isGoalMetAfterLog = true;
      totalDailyProgressAfterLog = value;
    }
  } else {
    const { data: completedTodayAfterLog } = await supabase.rpc('get_completed_tasks_today', {
      p_user_id: userId, p_timezone: timezone
    });
    
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

    totalDailyProgressAfterLog = userHabitData.measurement_type === 'timer'
      ? totalDailySeconds / 60
      : totalDailyUnits;
    
    const threshold = userHabitData.measurement_type === 'timer' ? 0.1 : 0.01;
    isGoalMetAfterLog = totalDailyProgressAfterLog >= (userHabitData.current_daily_goal - threshold);
  }

  let newIsTrialMode = userHabitData.is_trial_mode;
  let newDailyGoal = userHabitData.current_daily_goal;
  let newFrequency = userHabitData.frequency_per_week;
  let newGrowthPhase = userHabitData.growth_phase;
  let newHabitXp = (userHabitData.habit_xp || 0) + habitXpEarned;
  let newHabitLevel = calculateHabitLevel(newHabitXp);

  if (isGoalMetAfterLog) {
    const todayDateString = getTodayDateString(timezone);
    const leveledUp = newHabitLevel > (userHabitData.habit_level || 1);

    if (leveledUp) {
      if (userHabitData.growth_phase === 'frequency' && userHabitData.frequency_per_week < 7) {
        newFrequency = userHabitData.frequency_per_week + 1;
        newGrowthPhase = 'duration';
        showSuccess(`Level Up! ${userHabitData.name} is now Level ${newHabitLevel}. Frequency increased to ${newFrequency}x per week!`);
      } else {
        const growthType = userHabitData.growth_type || 'fixed';
        const growthValue = userHabitData.growth_value || 1;
        if (growthType === 'percentage') {
          newDailyGoal = userHabitData.current_daily_goal + (userHabitData.current_daily_goal * (Number(growthValue) / 100));
        } else {
          newDailyGoal = userHabitData.current_daily_goal + Number(growthValue);
        }
        if (userHabitData.max_goal_cap && newDailyGoal > userHabitData.max_goal_cap) {
          newDailyGoal = userHabitData.max_goal_cap;
          showSuccess(`Level Up! ${userHabitData.name} is now Level ${newHabitLevel}. Daily goal reached its cap!`);
        } else {
          showSuccess(`Level Up! ${userHabitData.name} is now Level ${newHabitLevel}. Daily goal increased to ${Math.round(newDailyGoal)} ${userHabitData.unit}!`);
        }
        newGrowthPhase = userHabitData.frequency_per_week < 7 ? 'frequency' : 'duration';
      }
      newIsTrialMode = false;
    }

    await supabase.from('user_habits').update({
      habit_xp: newHabitXp,
      habit_level: newHabitLevel,
      current_daily_goal: Math.round(newDailyGoal),
      frequency_per_week: Math.round(newFrequency),
      growth_phase: newGrowthPhase,
      is_trial_mode: newIsTrialMode,
      last_goal_increase_date: leveledUp ? todayDateString : userHabitData.last_goal_increase_date,
    }).eq('id', userHabitData.id);
  }

  await supabase.from('profiles').update({
    last_active_at: new Date().toISOString(),
    tasks_completed_today: (profileData.tasks_completed_today || 0) + 1,
  }).eq('id', userId);

  return { success: true, taskName, xpEarned, completedTaskId: insertedTask.id };
};

const unlogHabit = async ({ userId, completedTaskId }: { userId: string, completedTaskId: string }) => {
  const { data: task, error: fetchTaskError } = await supabase
    .from('completedtasks')
    .select('*, habit_xp_earned')
    .eq('id', completedTaskId)
    .eq('user_id', userId)
    .single();

  if (fetchTaskError || !task) throw fetchTaskError || new Error('Completed task not found');

  const { data: profileData } = await supabase
    .from('profiles')
    .select('timezone, tasks_completed_today')
    .eq('id', userId)
    .single();

  const timezone = profileData?.timezone || 'UTC';

  const { data: userHabitDataResult } = await supabase
    .from('user_habits')
    .select('*')
    .eq('user_id', userId)
    .eq('habit_key', task.original_source)
    .single();

  if (!userHabitDataResult) throw new Error(`Habit data not found for key: ${task.original_source}`);
  const userHabitData: UserHabitRecord = userHabitDataResult;

  if (task.habit_xp_earned > 0) {
    const newHabitXp = Math.max(0, (userHabitData.habit_xp || 0) - task.habit_xp_earned);
    const newHabitLevel = calculateHabitLevel(newHabitXp);
    await supabase.from('user_habits').update({ habit_xp: newHabitXp, habit_level: newHabitLevel }).eq('id', userHabitData.id);
  }

  const xpPerUnit = userHabitData.xp_per_unit || (userHabitData.unit === 'min' ? 30 : 1);
  let lifetimeProgressDecrementValue = userHabitData.measurement_type === 'timer' ? (task.duration_used || 0) : ((task.xp_earned || 0) / xpPerUnit);

  await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId, p_habit_key: task.original_source, p_increment_value: -Math.round(lifetimeProgressDecrementValue),
  });

  if (profileData) {
    await supabase.from('profiles').update({
      tasks_completed_today: Math.max(0, (profileData.tasks_completed_today || 0) - 1)
    }).eq('id', userId);
  }

  await supabase.from('completedtasks').delete().eq('id', completedTaskId);

  const isWeeklyAnchor = userHabitData.category === 'anchor' && userHabitData.frequency_per_week === 1;
  const { data: completedTodayAfterUnlog } = await supabase.rpc('get_completed_tasks_today', { p_user_id: userId, p_timezone: timezone });
  
  let totalDailyProgressAfterUnlog = 0;
  let isGoalMetAfterUnlog = false;

  if (userHabitData.complete_on_finish) {
    isGoalMetAfterUnlog = (completedTodayAfterUnlog || []).filter((t: any) => t.original_source === task.original_source).length >= 1;
    totalDailyProgressAfterUnlog = isGoalMetAfterUnlog ? userHabitData.current_daily_goal : 0;
  } else if (isWeeklyAnchor && userHabitData.measurement_type === 'timer') {
    const minDuration = userHabitData.weekly_session_min_duration || 10;
    const remainingSessionsToday = (completedTodayAfterUnlog || [])
      .filter((t: any) => t.original_source === task.original_source && t.duration_used && (t.duration_used / 60) >= minDuration);
    isGoalMetAfterUnlog = remainingSessionsToday.length > 0;
    totalDailyProgressAfterUnlog = remainingSessionsToday.length > 0 ? remainingSessionsToday[0].duration_used / 60 : 0; 
  } else {
    let totalDailySeconds = 0;
    let totalDailyUnits = 0;
    (completedTodayAfterUnlog || []).filter((t: any) => t.original_source === task.original_source).forEach((t: any) => {
      if (userHabitData.measurement_type === 'timer') totalDailySeconds += (t.duration_used || 0);
      else if (userHabitData.measurement_type === 'unit' || userHabitData.measurement_type === 'binary') totalDailyUnits += (task.xp_earned || 0) / xpPerUnit;
      else totalDailyUnits += 1;
    });
    totalDailyProgressAfterUnlog = userHabitData.measurement_type === 'timer' ? totalDailySeconds / 60 : totalDailyUnits;
    const threshold = userHabitData.measurement_type === 'timer' ? 0.1 : 0.01;
    isGoalMetAfterUnlog = totalDailyProgressAfterUnlog >= (userHabitData.current_daily_goal - threshold);
  }

  if (userHabitData.measurement_type !== 'binary' && !userHabitData.is_fixed && !userHabitData.complete_on_finish) {
    const surplusAfterUnlog = totalDailyProgressAfterUnlog - userHabitData.current_daily_goal;
    await supabase.from('user_habits').update({ carryover_value: Math.max(0, surplusAfterUnlog) }).eq('id', userHabitData.id);
  } else if (userHabitData.complete_on_finish) {
    await supabase.from('user_habits').update({ carryover_value: 0 }).eq('id', userHabitData.id);
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
    onSuccess: async (data) => {
      showSuccess(`${data.taskName} completed!`);
      await queryClient.refetchQueries({ queryKey: ['dashboardData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dailyHabitCompletion', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitHeatmapData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks', session?.user?.id] });
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
    onSuccess: async () => {
      showSuccess('Task uncompleted.');
      await queryClient.refetchQueries({ queryKey: ['dashboardData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dailyHabitCompletion', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitHeatmapData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks', session?.user?.id] });
    },
    onError: (error: any) => {
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