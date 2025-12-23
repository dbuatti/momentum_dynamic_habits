import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { initialHabits } from '@/lib/habit-data';
import { calculateLevel } from '@/utils/leveling';
import { differenceInDays, startOfWeek, endOfWeek, isSameDay, subDays } from 'date-fns';
import { UserHabitRecord } from '@/types/habit';

interface LogHabitParams {
  habitKey: string;
  value: number;
  taskName: string;
  difficultyRating?: number;
  note?: string;
}

const logHabit = async ({ userId, habitKey, value, taskName, difficultyRating, note }: LogHabitParams & { userId: string }) => {
  // Fetch user_habit data to get dynamic properties, including carryover_value
  const { data: userHabitDataResult, error: userHabitFetchError } = await supabase
    .from('user_habits')
    .select('*')
    .eq('user_id', userId)
    .eq('habit_key', habitKey)
    .single();

  if (!userHabitDataResult || userHabitFetchError) throw userHabitFetchError || new Error(`Habit data not found for key: ${habitKey}`);
  const userHabitData: UserHabitRecord = userHabitDataResult;

  const { data: profileData, error: profileFetchError } = await supabase
    .from('profiles')
    .select('tasks_completed_today, xp, level, timezone, neurodivergent_mode')
    .eq('id', userId)
    .single();

  if (profileFetchError) throw profileFetchError;
  const timezone = profileData.timezone || 'UTC';
  
  let xpBaseValue = value; // This will be in reps or minutes, used for XP calculation
  let lifetimeProgressIncrementValue = value; // This will be in reps or minutes, used for lifetime progress
  let durationUsedForDB = null; // This will be in seconds for time-based habits

  if (userHabitData.unit === 'min') {
    durationUsedForDB = value * 60; // Convert minutes to seconds for DB storage
    lifetimeProgressIncrementValue = value * 60; // Convert minutes to seconds for lifetime progress
  } else {
    durationUsedForDB = null;
    lifetimeProgressIncrementValue = value; // Already in reps or doses
  }

  const xpEarned = Math.round(xpBaseValue * userHabitData.xp_per_unit);
  const energyCost = Math.round(xpBaseValue * userHabitData.energy_cost_per_unit);

  console.log(`[XP Debug] Logging habit: ${habitKey}, value: ${value} ${userHabitData.unit}`);
  console.log(`[XP Debug]   xpBaseValue: ${xpBaseValue}, xpPerUnit: ${userHabitData.xp_per_unit}, xpEarned: ${xpEarned}`);
  console.log(`[XP Debug]   lifetimeProgressIncrementValue: ${lifetimeProgressIncrementValue}`);
  console.log(`[XP Debug]   durationUsedForDB: ${durationUsedForDB}`);
  console.log(`[XP Debug]   energyCost: ${energyCost}`);

  const { error: insertError } = await supabase.from('completedtasks').insert({
    user_id: userId, original_source: habitKey, task_name: taskName,
    duration_used: durationUsedForDB,
    xp_earned: xpEarned,
    energy_cost: energyCost, difficulty_rating: difficultyRating || null,
    completed_at: new Date().toISOString(),
    note: note || null,
  });

  if (insertError) throw insertError;

  await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId, p_habit_key: habitKey, p_increment_value: lifetimeProgressIncrementValue,
  });

  // Fetch current daily progress *after* this log
  const { data: completedTodayAfterLog } = await supabase.rpc('get_completed_tasks_today', { 
    p_user_id: userId, p_timezone: timezone 
  });
  let totalDailyProgressAfterLog = 0;
  (completedTodayAfterLog || []).filter((task: any) => task.original_source === habitKey).forEach((task: any) => {
    if (userHabitData.unit === 'min') totalDailyProgressAfterLog += (task.duration_used || 0) / 60;
    else if (userHabitData.unit === 'reps' || userHabitData.unit === 'dose') totalDailyProgressAfterLog += (task.xp_earned || 0) / (userHabitData.xp_per_unit || 1);
    else totalDailyProgressAfterLog += 1; // Fallback for unknown units
  });
  
  // Calculate surplus for carryover
  const surplus = totalDailyProgressAfterLog - userHabitData.current_daily_goal;
  const newCarryoverValue = Math.max(0, surplus); // Carryover cannot be negative

  // Update carryover_value in user_habits
  await supabase.from('user_habits').update({
    carryover_value: newCarryoverValue,
  }).eq('id', userHabitData.id);

  const isGoalMetAfterLog = totalDailyProgressAfterLog >= userHabitData.current_daily_goal;

  // Adaptive logic
  const isFixedGoalHabit = userHabitData.is_fixed;
  let newDailyGoal = userHabitData.current_daily_goal;
  let newFrequency = userHabitData.frequency_per_week;
  let newGrowthPhase = userHabitData.growth_phase;
  let newIsTrialMode = userHabitData.is_trial_mode; // Track if trial mode changes

  const todayDate = new Date();
  const todayDateString = todayDate.toISOString().split('T')[0];
  
  // Use habit-specific plateau_days_required
  const plateauRequired = userHabitData.plateau_days_required; 
  
  let newCompletionsInPlateau = userHabitData.completions_in_plateau;
  let newLastPlateauStartDate = userHabitData.last_plateau_start_date;

  // Logic for updating completions_in_plateau and last_plateau_start_date
  // This aims to track consecutive days of meeting the goal within the plateau period.
  const lastPlateauDate = new Date(userHabitData.last_plateau_start_date);
  const isNewDayForPlateau = !isSameDay(todayDate, lastPlateauDate);

  if (isGoalMetAfterLog) {
    // If goal is met today
    if (isNewDayForPlateau) {
      // If it's a new day, check if yesterday's goal was met to continue streak
      const yesterday = subDays(todayDate, 1); 
      const { data: completedYesterday } = await supabase.from('completedtasks')
        .select('id')
        .eq('user_id', userId)
        .eq('original_source', habitKey)
        .gte('completed_at', yesterday.toISOString())
        .lte('completed_at', todayDate.toISOString()) // Check up to start of today
        .limit(1);
      
      const wasCompletedYesterday = completedYesterday && completedYesterday.length > 0;

      if (isSameDay(lastPlateauDate, yesterday) && wasCompletedYesterday) {
        // Continue streak
        newCompletionsInPlateau = userHabitData.completions_in_plateau + 1;
      } else {
        // Start new streak
        newCompletionsInPlateau = 1;
      }
      newLastPlateauStartDate = todayDateString;
    } else {
      // Same day, goal met, no change to completions_in_plateau (already counted for today)
      // This ensures multiple logs on the same day don't inflate `completions_in_plateau`
    }
  } else if (isNewDayForPlateau) {
    // If it's a new day and goal is NOT met, reset plateau progress
    newCompletionsInPlateau = 0;
    newLastPlateauStartDate = todayDateString;
  }

  // Check for Trial -> Growth transition
  if (userHabitData.is_trial_mode && newCompletionsInPlateau >= plateauRequired) {
    newIsTrialMode = false; // Transition out of trial mode
    showSuccess(`Congratulations! Your ${userHabitData.name} habit has transitioned from Trial Mode to Adaptive Growth!`);
  }

  // Only apply growth logic if not trial and not fixed/frozen
  if (!newIsTrialMode && !isFixedGoalHabit && !userHabitData.is_frozen) { 
    if (newCompletionsInPlateau >= plateauRequired) { // Check against newCompletionsInPlateau
      // Growth logic
      if (userHabitData.growth_phase === 'frequency' && userHabitData.frequency_per_week < 7) {
        newFrequency = userHabitData.frequency_per_week + 1;
        newGrowthPhase = 'duration';
        showSuccess(`Dynamic Growth: Frequency for ${userHabitData.name} increased to ${newFrequency}x per week!`);
      } else if (userHabitData.growth_phase === 'duration') {
        // Neurodivergent mode specific increments
        const increment = profileData.neurodivergent_mode ? 5 : 10; // 5 min for ND, 10 for standard
        if (userHabitData.unit === 'min') newDailyGoal = userHabitData.current_daily_goal + increment;
        else newDailyGoal = userHabitData.current_daily_goal + 1; // Reps/doses increment by 1

        if (!userHabitData.max_goal_cap || newDailyGoal <= userHabitData.max_goal_cap) {
          newGrowthPhase = userHabitData.frequency_per_week < 7 ? 'frequency' : 'duration';
          showSuccess(`Dynamic Growth: Daily goal for ${userHabitData.name} increased to ${newDailyGoal} ${userHabitData.unit}!`);
        } else {
          newDailyGoal = userHabitData.max_goal_cap;
          showSuccess(`Dynamic Growth: Daily goal for ${userHabitData.name} reached its cap at ${newDailyGoal} ${userHabitData.unit}!`);
        }
      }

      await supabase.from('user_habits').update({
        last_plateau_start_date: todayDateString,
        completions_in_plateau: 0, // Reset after growth
        last_goal_increase_date: todayDateString,
        current_daily_goal: newDailyGoal,
        frequency_per_week: newFrequency,
        growth_phase: newGrowthPhase,
        is_trial_mode: newIsTrialMode, // Update trial mode status
      }).eq('id', userHabitData.id);
    }
  } else {
    // If not in growth mode (e.g., trial, fixed, or frozen), just update plateau progress
    await supabase.from('user_habits').update({
      completions_in_plateau: newCompletionsInPlateau,
      last_plateau_start_date: newLastPlateauStartDate,
      is_trial_mode: newIsTrialMode, // Update trial mode status
    }).eq('id', userHabitData.id);
  }

  const newXp = (profileData.xp || 0) + xpEarned;
  await supabase.from('profiles').update({
    last_active_at: new Date().toISOString(),
    tasks_completed_today: (profileData.tasks_completed_today || 0) + 1,
    xp: newXp,
    level: calculateLevel(newXp),
  }).eq('id', userId);

  return { success: true, taskName, xpEarned }; // Return taskName and xpEarned for success message
};

const unlogHabit = async ({ userId, habitKey, taskName }: { userId: string, habitKey: string, taskName: string }) => {
  // Fetch profile to get timezone for RPC call
  const { data: profileData, error: profileFetchError } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single();

  if (profileFetchError) {
    console.error('Error fetching profile for unlogging:', profileFetchError);
    // Fallback to UTC if profile fetch fails
  }
  const timezone = profileData?.timezone || 'UTC';

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

  // Fetch user_habit data to get dynamic properties, including carryover_value
  const { data: userHabitDataResult, error: userHabitFetchError } = await supabase
    .from('user_habits')
    .select('id, unit, xp_per_unit, current_daily_goal, completions_in_plateau, last_plateau_start_date, carryover_value')
    .eq('user_id', userId)
    .eq('habit_key', habitKey)
    .single();

  if (!userHabitDataResult || userHabitFetchError) throw userHabitFetchError || new Error(`Habit data not found for key: ${habitKey}`);
  const userHabitData: Pick<UserHabitRecord, 'id' | 'unit' | 'xp_per_unit' | 'current_daily_goal' | 'completions_in_plateau' | 'last_plateau_start_date' | 'carryover_value'> = userHabitDataResult;

  let lifetimeProgressDecrementValue;
  if (userHabitData.unit === 'min') {
    lifetimeProgressDecrementValue = task.duration_used || 0; // In seconds
  } else {
    lifetimeProgressDecrementValue = (task.xp_earned || 0) / (userHabitData.xp_per_unit || 1); // Convert XP back to reps/doses
  }

  console.log(`[XP Debug] Unlogging habit: ${habitKey}, task_id: ${task.id}`);
  console.log(`[XP Debug]   xp_earned to revert: ${task.xp_earned}`);
  console.log(`[XP Debug]   lifetimeProgressDecrementValue: ${lifetimeProgressDecrementValue}`);

  await supabase.rpc('increment_lifetime_progress', {
    p_user_id: userId, p_habit_key: habitKey, p_increment_value: -lifetimeProgressDecrementValue,
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

  // Recalculate carryover_value after unlogging
  const { data: completedTodayAfterUnlog } = await supabase.rpc('get_completed_tasks_today', { 
    p_user_id: userId, p_timezone: timezone 
  });
  let totalDailyProgressAfterUnlog = 0;
  (completedTodayAfterUnlog || []).filter((t: any) => t.original_source === habitKey && t.id !== task.id).forEach((t: any) => {
    if (userHabitData.unit === 'min') totalDailyProgressAfterUnlog += (t.duration_used || 0) / 60;
    else if (userHabitData.unit === 'reps' || userHabitData.unit === 'dose') totalDailyProgressAfterUnlog += (t.xp_earned || 0) / (userHabitData.xp_per_unit || 1);
    else totalDailyProgressAfterUnlog += 1;
  });

  const surplusAfterUnlog = totalDailyProgressAfterUnlog - userHabitData.current_daily_goal;
  const newCarryoverValueAfterUnlog = Math.max(0, surplusAfterUnlog);

  await supabase.from('user_habits').update({
    carryover_value: newCarryoverValueAfterUnlog,
  }).eq('id', userHabitData.id);

  // Decrement completions_in_plateau if unlogging causes goal to be unmet for today
  const isGoalMetAfterUnlog = totalDailyProgressAfterUnlog >= userHabitData.current_daily_goal;

  if (!isGoalMetAfterUnlog && userHabitData.completions_in_plateau > 0) {
    await supabase.from('user_habits').update({
      completions_in_plateau: userHabitData.completions_in_plateau - 1,
    }).eq('id', userHabitData.id);
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
    onSuccess: (data) => {
      showSuccess(`${data.taskName} completed! +${data.xpEarned} XP`); // More specific success message
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dailyHabitCompletion', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitHeatmapData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', session?.user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['dailyHabitCompletion', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitHeatmapData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habitCapsules', session?.user?.id] });
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