import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { initialHabits } from '@/lib/habit-data';
import { calculateLevel } from '@/utils/leveling';
import { differenceInDays, startOfWeek, endOfWeek, isSameDay, subDays } from 'date-fns'; // Added subDays
import { UserHabitRecord } from '@/types/habit'; // Added UserHabitRecord import

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
  
  const { data: userHabitDataResult, error: userHabitFetchError } = await supabase
    .from('user_habits')
    .select('*')
    .eq('user_id', userId)
    .eq('habit_key', habitKey)
    .single();

  if (!userHabitDataResult || userHabitFetchError) throw userHabitFetchError || new Error(`Habit data not found for key: ${habitKey}`);
  const userHabitData: UserHabitRecord = userHabitDataResult; // Explicitly type userHabitData

  let xpBaseValue = value; // This will be in reps or minutes, used for XP calculation
  let lifetimeProgressIncrementValue = value; // This will be in reps or minutes, used for lifetime progress
  let durationUsedForDB = null; // This will be in seconds for time-based habits

  if (habitConfig.type === 'time' && habitConfig.unit === 'min') {
    // For time-based habits, 'value' is in minutes.
    // XP is calculated based on minutes (xpBaseValue).
    // lifetime_progress in DB is in seconds, so increment by seconds.
    // duration_used in completedtasks is in seconds.
    durationUsedForDB = value * 60; // Convert minutes to seconds for DB storage
    lifetimeProgressIncrementValue = value * 60; // Convert minutes to seconds for lifetime progress
  } else {
    // For count-based habits, 'value' is in reps.
    // XP is calculated based on reps (xpBaseValue).
    // lifetime_progress in DB is in reps, so increment by reps.
    // duration_used is null.
    durationUsedForDB = null;
    lifetimeProgressIncrementValue = value; // Already in reps
  }

  const xpEarned = Math.round(xpBaseValue * habitConfig.xpPerUnit);
  const energyCost = Math.round(xpBaseValue * habitConfig.energyCostPerUnit);

  console.log(`[XP Debug] Logging habit: ${habitKey}, value: ${value} ${habitConfig.unit}`);
  console.log(`[XP Debug]   xpBaseValue: ${xpBaseValue}, xpPerUnit: ${habitConfig.xpPerUnit}, xpEarned: ${xpEarned}`);
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
    if (habitConfig.type === 'time' && habitConfig.unit === 'min') totalDailyProgressAfterLog += (task.duration_used || 0) / 60;
    else if (habitConfig.type === 'count') totalDailyProgressAfterLog += (task.xp_earned || 0) / (habitConfig.xpPerUnit || 1);
    else totalDailyProgressAfterLog += 1; // For fixed count habits like medication
  });
  const isGoalMetAfterLog = totalDailyProgressAfterLog >= userHabitData.current_daily_goal;

  // Adaptive logic
  const isFixedGoalHabit = userHabitData.is_fixed || ['teeth_brushing', 'medication'].includes(habitKey);
  let newDailyGoal = userHabitData.current_daily_goal;
  let newFrequency = userHabitData.frequency_per_week;
  let newGrowthPhase = userHabitData.growth_phase;
  
  const todayDate = new Date();
  const todayDateString = todayDate.toISOString().split('T')[0];
  
  // Use habit-specific plateau_days_required
  const plateauRequired = userHabitData.plateau_days_required; 
  const daysInPlateau = differenceInDays(todayDate, new Date(userHabitData.last_plateau_start_date));
  
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

  // Only apply growth logic if not trial and not fixed/frozen
  if (!userHabitData.is_trial_mode && !isFixedGoalHabit && !userHabitData.is_frozen) { 
    if (newCompletionsInPlateau >= plateauRequired) { // Check against newCompletionsInPlateau
      // Growth logic
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
        completions_in_plateau: 0, // Reset after growth
        last_goal_increase_date: todayDateString,
        current_daily_goal: newDailyGoal,
        frequency_per_week: newFrequency,
        growth_phase: newGrowthPhase,
      }).eq('id', userHabitData.id);
    }
  }

  // Update user_habits with new plateau progress
  await supabase.from('user_habits').update({
    completions_in_plateau: newCompletionsInPlateau,
    last_plateau_start_date: newLastPlateauStartDate,
  }).eq('id', userHabitData.id);

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
  const timezone = profileData?.timezone || 'UTC'; // Defined timezone here

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
  if (!habitConfig) throw new Error(`Habit configuration not found for key: ${habitKey}`);

  let lifetimeProgressDecrementValue;
  if (habitConfig.type === 'time' && habitConfig.unit === 'min') {
    lifetimeProgressDecrementValue = task.duration_used || 0; // In seconds
  } else {
    // For count-based habits, lifetime_progress is in reps.
    // task.xp_earned is XP, so convert back to reps.
    lifetimeProgressDecrementValue = (task.xp_earned || 0) / (habitConfig.xpPerUnit || 1);
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

  // Decrement completions_in_plateau if unlogging causes goal to be unmet for today
  const { data: userHabitDataResult, error: userHabitFetchError } = await supabase
    .from('user_habits')
    .select('id, current_daily_goal, completions_in_plateau, last_plateau_start_date') // Select id explicitly
    .eq('user_id', userId)
    .eq('habit_key', habitKey)
    .single();

  if (userHabitDataResult && !userHabitFetchError) {
    const userHabitData: UserHabitRecord = userHabitDataResult as UserHabitRecord; // Explicitly type it here
    const { data: completedTodayAfterUnlog } = await supabase.rpc('get_completed_tasks_today', { 
      p_user_id: userId, p_timezone: timezone 
    });
    let totalDailyProgressAfterUnlog = 0;
    (completedTodayAfterUnlog || []).filter((t: any) => t.original_source === habitKey && t.id !== task.id).forEach((t: any) => {
      if (habitConfig?.type === 'time' && habitConfig?.unit === 'min') totalDailyProgressAfterUnlog += (t.duration_used || 0) / 60;
      else if (habitConfig?.type === 'count') totalDailyProgressAfterUnlog += (t.xp_earned || 0) / (habitConfig.xpPerUnit || 1);
      else totalDailyProgressAfterUnlog += 1;
    });
    const isGoalMetAfterUnlog = totalDailyProgressAfterUnlog >= userHabitData.current_daily_goal;

    // If goal was met before unlogging, but now isn't, decrement completions_in_plateau
    // This is a simplification, a full re-evaluation of the plateau state would be more robust.
    if (!isGoalMetAfterUnlog && userHabitData.completions_in_plateau > 0) {
      await supabase.from('user_habits').update({
        completions_in_plateau: userHabitData.completions_in_plateau - 1,
      }).eq('id', userHabitData.id);
    }
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