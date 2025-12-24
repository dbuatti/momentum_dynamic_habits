import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { startOfDay, differenceInDays, startOfWeek, endOfWeek, subWeeks, addMonths, subDays, formatDistanceToNowStrict, isWithinInterval, parse } from 'date-fns';
import { initialHabits } from '@/lib/habit-data';
import { ProcessedUserHabit } from '@/types/habit';

const fetchDashboardData = async (userId: string) => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('journey_start_date, daily_streak, last_active_at, first_name, last_name, timezone, xp, level, tasks_completed_today, daily_challenge_target, neurodivergent_mode, enable_sound, enable_haptics')
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

  const weeklyCompletionMap = new Map<string, number>();
  
  (completedThisWeek || []).forEach(task => {
    const day = startOfDay(new Date(task.completed_at)).toISOString();
    const key = `${task.original_source}_${day}`;
    weeklyCompletionMap.set(key, 1);
  });

  const dailyProgressMap = new Map<string, number>();
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
    // Use a sensible default of 30 XP if missing, or 1 if count-based
    const xpPerUnit = userHabit?.xp_per_unit || (userHabit?.unit === 'min' ? 30 : 1);

    let progress = 0;
    if (mType === 'timer') progress = (task.duration_used || 0) / 60;
    else if (mType === 'unit' || mType === 'binary') progress = (task.xp_earned || 0) / xpPerUnit;
    else progress = 1;

    dailyProgressMap.set(key, (dailyProgressMap.get(key) || 0) + progress);
  });

  const processedHabits: ProcessedUserHabit[] = (habits || [])
    .filter(h => h.is_visible)
    .map(h => {
    const rawDailyProgress = dailyProgressMap.get(h.habit_key) || 0;
    const capsuleTaskMapping = dailyCapsuleTasksMap.get(h.habit_key) || {};
    const baseAdjustedDailyGoal = h.current_daily_goal + (h.carryover_value || 0);
    
    // Robustly handle string vs number array for days_of_week
    const activeDays = h.days_of_week ? h.days_of_week.map((d: any) => Number(d)) : [0, 1, 2, 3, 4, 5, 6];
    const isScheduledForToday = activeDays.includes(currentDayOfWeek);

    let isWithinWindow = true;
    if (h.window_start && h.window_end) {
      const now = new Date();
      try {
        const start = parse(h.window_start, 'HH:mm', now);
        const end = parse(h.window_end, 'HH:mm', now);
        isWithinWindow = isWithinInterval(now, { start, end });
      } catch (e) {
        console.error("Window parsing error", e);
      }
    }

    const weeklyCompletions = Array.from(weeklyCompletionMap.keys())
      .filter(k => k.startsWith(`${h.habit_key}_`)).length;

    const isDependent = !!h.dependent_on_habit_id;
    const dependentHabit = habits?.find(depH => depH.id === h.dependent_on_habit_id);
    const isDependencyMet = isDependent ? completedHabitKeysToday.has(dependentHabit?.habit_key || '') : true;
    const isLockedByDependency = isDependent && !isDependencyMet;

    let isComplete = false;
    const mType = h.measurement_type || 'timer';
    const unit = h.unit || (mType === 'timer' ? 'min' : (mType === 'binary' ? 'dose' : 'reps'));

    if (mType === 'binary') {
      isComplete = completedHabitKeysToday.has(h.habit_key);
    } else {
      isComplete = rawDailyProgress >= (baseAdjustedDailyGoal - 0.01);
    }

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
      weekly_goal: (mType === 'binary' ? 1 : h.current_daily_goal) * h.frequency_per_week,
      isScheduledForToday,
      isWithinWindow,
      measurement_type: mType, 
      growth_stats: {
        completions: h.completions_in_plateau,
        required: h.plateau_days_required,
        daysRemaining: Math.max(0, h.plateau_days_required - h.completions_in_plateau),
        phase: h.growth_phase
      },
      isLockedByDependency,
      capsuleTaskMapping, 
    } as any;
  });

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
    tasks_completed_today: profile?.tasks_completed_today || 0,
    daily_challenge_target: profile?.daily_challenge_target || 3,
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