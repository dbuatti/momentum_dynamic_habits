import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { startOfDay, differenceInDays, startOfWeek, endOfWeek, subWeeks, addMonths, subDays, formatDistanceToNowStrict, isWithinInterval, parse } from 'date-fns';
import { initialHabits } from '@/lib/habit-data';
import { ProcessedUserHabit } from '@/types/habit';
import { calculateDynamicChunks, calculateDailyParts } from '@/utils/progress-utils';

const fetchDashboardData = async (userId: string) => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('journey_start_date, daily_streak, last_active_at, first_name, last_name, timezone, xp, level, neurodivergent_mode, enable_sound, enable_haptics, day_rollover_hour, custom_habit_order, section_order') 
    .eq('id', userId)
    .single();

  if (profileError) throw new Error('Failed to fetch Profile');
  const timezone = profile?.timezone || 'UTC';
  const today = new Date();
  const currentDayOfWeek = today.getDay();

  const [
    { data: habits, error: habitsError },
    { data: completedToday, error: completedTodayError },
    { data: completedThisWeek, error: completedThisWeekError },
    { data: completedLastWeek, error: completedLastWeekError },
    { count: totalSessions, error: totalCompletedError },
    { data: distinctDays, error: distinctDaysError },
    { data: bestTime, error: bestTimeError },
    { data: randomTip, error: randomTipError },
  ] = await Promise.all([
    supabase.from('user_habits').select('*, measurement_type').eq('user_id', userId),
    supabase.rpc('get_completed_tasks_today', { p_user_id: userId, p_timezone: timezone }),
    supabase.from('completedtasks').select('id, original_source, duration_used, xp_earned, completed_at').eq('user_id', userId).gte('completed_at', startOfWeek(today).toISOString()).lte('completed_at', endOfWeek(today).toISOString()),
    supabase.from('completedtasks').select('original_source, duration_used, xp_earned').eq('user_id', userId).gte('completed_at', startOfWeek(subWeeks(today, 1)).toISOString()).lte('completed_at', endOfWeek(subWeeks(today, 1)).toISOString()),
    supabase.from('completedtasks').select('id', { count: 'exact' }),
    supabase.rpc('get_distinct_completed_days', { p_user_id: userId }),
    supabase.rpc('get_best_time', { p_user_id: userId }),
    supabase.from('tips').select('content, related_habit_key').order('created_at', { ascending: false }).limit(1).single()
  ]);

  if (profileError || habitsError || completedTodayError) throw new Error('Failed to fetch essential data');

  const weeklySessionCountMap = new Map<string, number>();
  const weeklyMinutesMap = new Map<string, number>();

  (completedThisWeek || []).forEach(task => {
    const key = task.original_source;
    weeklySessionCountMap.set(key, (weeklySessionCountMap.get(key) || 0) + 1);
    
    // Sum up minutes for the week
    const userHabit = habits?.find(h => h.habit_key === key);
    if (userHabit?.unit === 'min') {
      const minutes = (task.duration_used || 0) / 60;
      weeklyMinutesMap.set(key, (weeklyMinutesMap.get(key) || 0) + minutes);
    } else if (userHabit) {
      const xpPerUnit = userHabit.xp_per_unit || 1;
      const units = (task.xp_earned || 0) / xpPerUnit;
      weeklyMinutesMap.set(key, (weeklyMinutesMap.get(key) || 0) + units);
    }
  });

  const dailySecondsMap = new Map<string, number>();
  const dailyUnitProgressMap = new Map<string, number>();
  const dailyCapsuleTasksMap = new Map<string, Record<number, string>>(); 
  const completedHabitKeysToday = new Set<string>();

  (completedToday || []).forEach((task: any) => {
    const key = task.original_source;
    completedHabitKeysToday.add(key);
    
    if (task.capsule_index !== null) {
      const habitMap = dailyCapsuleTasksMap.get(key) || {};
      habitMap[task.capsule_index] = task.id;
      dailyCapsuleTasksMap.set(key, habitMap);
    }

    const userHabit = habits?.find(h => h.habit_key === key);
    const mType = userHabit?.measurement_type || 'timer';
    const xpPerUnit = userHabit?.xp_per_unit || (userHabit?.unit === 'min' ? 30 : 1);

    if (mType === 'timer') {
      const seconds = task.duration_used || 0;
      dailySecondsMap.set(key, (dailySecondsMap.get(key) || 0) + seconds);
    } else {
      const progress = (task.xp_earned || 0) / xpPerUnit;
      dailyUnitProgressMap.set(key, (dailyUnitProgressMap.get(key) || 0) + progress);
    }
  });

  const processedHabits: ProcessedUserHabit[] = (habits || [])
    .map(h => {
    const mType = h.measurement_type || 'timer';
    let rawDailyProgress = 0;
    if (mType === 'timer') {
      rawDailyProgress = (dailySecondsMap.get(h.habit_key) || 0) / 60;
    } else {
      rawDailyProgress = dailyUnitProgressMap.get(h.habit_key) || 0;
    }

    const capsuleTaskMapping = dailyCapsuleTasksMap.get(h.habit_key) || {};
    const carryover = (h.measurement_type !== 'binary' && !h.is_fixed) ? (h.carryover_value || 0) : 0;
    const baseAdjustedDailyGoal = h.current_daily_goal + carryover;

    const activeDays = (h.days_of_week || []).map((d: any) => Number(d));
    const isScheduledForToday = activeDays.includes(currentDayOfWeek);

    let isWithinWindow = true;
    if (h.window_start && h.window_end) {
      const now = new Date();
      try {
        const start = parse(h.window_start, 'HH:mm', now);
        const end = parse(h.window_end, 'HH:mm', now);
        isWithinInterval(now, { start, end });
      } catch (e) {
        console.error("Window parsing error", e);
      }
    }

    const weeklyCompletions = weeklySessionCountMap.get(h.habit_key) || 0;
    const weeklyDuration = weeklyMinutesMap.get(h.habit_key) || 0; // NEW FIELD
    const isWeeklyAnchor = h.category === 'anchor' && h.frequency_per_week === 1;
    let isComplete = false;
    const unit = h.unit || (mType === 'timer' ? 'min' : (mType === 'binary' ? 'dose' : 'reps'));

    if (h.is_fixed && mType !== 'binary') {
      const threshold = mType === 'timer' ? 0.1 : 0.01;
      isComplete = rawDailyProgress >= (baseAdjustedDailyGoal - threshold);
    } 
    else if (h.complete_on_finish || mType === 'binary') {
      isComplete = completedHabitKeysToday.has(h.habit_key);
    } 
    else if (isWeeklyAnchor) {
      isComplete = weeklyCompletions >= 1;
    } 
    else {
      const threshold = mType === 'timer' ? 0.1 : 0.01;
      isComplete = rawDailyProgress >= (baseAdjustedDailyGoal - threshold);
    }

    const isDependent = !!h.dependent_on_habit_id;
    const dependentHabit = habits?.find(depH => depH.id === h.dependent_on_habit_id);
    const isDependencyMet = isDependent ? completedHabitKeysToday.has(dependentHabit?.habit_key || '') : true;

    return {
      ...h,
      key: h.habit_key,
      name: h.name || h.habit_key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
      unit,
      dailyGoal: mType === 'binary' ? 1 : h.current_daily_goal,
      adjustedDailyGoal: baseAdjustedDailyGoal,
      carryoverValue: mType === 'binary' ? 0 : (h.carryover_value || 0),
      dailyProgress: rawDailyProgress, 
      isComplete: isComplete,
      xpPerUnit: h.xp_per_unit || (h.unit === 'min' ? 30 : 1),
      energyCostPerUnit: h.energy_cost_per_unit || (h.unit === 'min' ? 6 : 0.5),
      weekly_completions: weeklyCompletions,
      weekly_total_minutes: weeklyDuration, // PASS TO COMPONENT
      weekly_goal: (mType === 'binary' ? 1 : h.current_daily_goal) * h.frequency_per_week,
      weekly_progress: weeklyCompletions, 
      isScheduledForToday,
      isWithinWindow,
      measurement_type: mType, 
      growth_stats: {
        completions: h.completions_in_plateau,
        required: h.plateau_days_required,
        daysRemaining: Math.max(0, h.plateau_days_required - h.completions_in_plateau),
        phase: h.growth_phase
      },
      isLockedByDependency: isDependent && !isDependencyMet,
      capsuleTaskMapping, 
    } as any;
  });

  // Apply custom sorting order if available
  const customOrder = profile?.custom_habit_order;
  if (customOrder && customOrder.length > 0) {
    processedHabits.sort((a, b) => {
      const indexA = customOrder.indexOf(a.habit_key);
      const indexB = customOrder.indexOf(b.habit_key);

      // If both are in custom order, sort by their index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only A is in custom order, A comes first
      if (indexA !== -1) {
        return -1;
      }
      // If only B is in custom order, B comes first
      if (indexB !== -1) {
        return 1;
      }
      // If neither are in custom order, maintain original sort (or secondary sort)
      return 0;
    });
  }


  const dailyMomentumHabits = processedHabits.filter(h => {
    const isWeeklyAnchor = h.category === 'anchor' && h.frequency_per_week === 1;
    const isWeeklyObjective = (h as any).is_weekly_goal;
    
    if (isWeeklyAnchor || isWeeklyObjective) return false; 
    if (!h.is_visible) return false;
    if (!h.isScheduledForToday) return false;
    if (h.isLockedByDependency) return false;

    return true;
  });
  
  const dailyMomentumParts = calculateDailyParts(dailyMomentumHabits, profile?.neurodivergent_mode || false);

  const calculateTotals = (tasks: any[]) => {
    const totals = { pushups: 0, meditation: 0 };
    tasks.forEach(t => {
      const userHabit = habits?.find(h => h.habit_key === t.original_source);
      const xpPerUnit = userHabit?.xp_per_unit || (userHabit?.unit === 'min' ? 30 : 1);
      if (t.original_source === 'pushups') totals.pushups += (t.xp_earned || 0) / xpPerUnit;
      if (t.original_source === 'meditation') totals.meditation += (t.duration_used || 0) / 60;
    });
    return totals;
  };

  const currentWeekTotals = calculateTotals(completedThisWeek || []);
  const previousWeekTotals = calculateTotals(completedLastWeek || []);
  const startDate = profile?.journey_start_date ? new Date(profile.journey_start_date) : new Date();
  const totalDaysSinceStart = differenceInDays(startOfDay(new Date()), startOfDay(startDate)) + 1;
  const consistency = totalDaysSinceStart > 0 && typeof distinctDays === 'number' ? Math.round((distinctDays / totalDaysSinceStart) * 100) : 0;

  return {
    daysActive: totalDaysSinceStart,
    habits: processedHabits,
    neurodivergentMode: profile?.neurodivergent_mode || false,
    enable_sound: profile?.enable_sound ?? true,
    enable_haptics: profile?.enable_haptics ?? true,
    weeklySummary: { 
      activeDays: new Set((completedThisWeek || []).map(t => startOfDay(new Date(t.completed_at)).toISOString())).size,
      pushups: { current: currentWeekTotals.pushups, previous: previousWeekTotals.pushups },
      meditation: { current: currentWeekTotals.meditation, previous: previousWeekTotals.meditation },
    },
    patterns: { streak: profile?.daily_streak || 0, totalSessions: totalSessions || 0, consistency, bestTime: bestTime || '—' },
    lastActiveText: profile?.last_active_at ? formatDistanceToNowStrict(new Date(profile.last_active_at), { addSuffix: true }) : 'Never',
    firstName: profile?.first_name || null, 
    lastName: profile?.last_name || null,
    tip: randomTip || null, 
    xp: profile?.xp || 0, 
    level: profile?.level || 1, 
    averageDailyTasks: totalSessions && totalDaysSinceStart > 0 ? (totalSessions / totalDaysSinceStart).toFixed(1) : '0.0',
    dailyMomentumParts,
    dayRolloverHour: profile?.day_rollover_hour || 0,
    customHabitOrder: profile?.custom_habit_order || [],
    sectionOrder: profile?.section_order || ['anchor', 'weekly_objective', 'daily_momentum'], // Include section order
  };
};

export const useDashboardData = () => {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['dashboardData', userId],
    queryFn: () => fetchDashboardData(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};