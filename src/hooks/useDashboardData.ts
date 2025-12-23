import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { startOfDay, differenceInDays, startOfWeek, endOfWeek, subWeeks, addMonths, subDays, formatDistanceToNowStrict, isWithinInterval, parse } from 'date-fns';
import { initialHabits } from '@/lib/habit-data';
import { useEffect, useRef } from 'react';

const fetchDashboardData = async (userId: string) => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('journey_start_date, daily_streak, last_active_at, first_name, last_name, timezone, xp, level, tasks_completed_today, neurodivergent_mode')
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
    supabase.from('user_habits').select('*').eq('user_id', userId),
    supabase.rpc('get_completed_tasks_today', { p_user_id: userId, p_timezone: timezone }),
    supabase.from('completedtasks').select('original_source, duration_used, xp_earned, completed_at').eq('user_id', userId).gte('completed_at', startOfWeek(today).toISOString()).lte('completed_at', endOfWeek(today).toISOString()),
    supabase.from('completedtasks').select('original_source, duration_used, xp_earned').eq('user_id', userId).gte('completed_at', startOfWeek(subWeeks(today, 1)).toISOString()).lte('completed_at', endOfWeek(subWeeks(today, 1)).toISOString()),
    supabase.from('completedtasks').select('id', { count: 'exact' }),
    supabase.rpc('get_distinct_completed_days', { p_user_id: userId }),
    supabase.rpc('get_best_time', { p_user_id: userId }),
    supabase.from('tips').select('content, related_habit_key').order('created_at', { ascending: false }).limit(1).single()
  ]);

  if (habitsError || completedTodayError) throw new Error('Failed to fetch essential data');

  // Use a map for initialHabits for quick lookup, but prioritize DB values
  const initialHabitsMap = new Map(initialHabits.map(h => [h.id, h]));
  const weeklyCompletionMap = new Map<string, number>();
  
  (completedThisWeek || []).forEach(task => {
    const day = startOfDay(new Date(task.completed_at)).toISOString();
    const key = `${task.original_source}_${day}`;
    weeklyCompletionMap.set(key, 1);
  });

  const dailyProgressMap = new Map<string, number>();
  (completedToday || []).forEach((task: any) => {
    const key = task.original_source;
    const habitConfig = initialHabitsMap.get(key); // Fallback to initial config if needed
    
    // Determine unit and xp_per_unit from user_habits table first, then fallback to initialHabits
    const userHabit = habits?.find(h => h.habit_key === key);
    const unit = userHabit?.unit || habitConfig?.unit || 'min';
    const xpPerUnit = userHabit?.xp_per_unit || habitConfig?.xpPerUnit || 1;

    let progress = 0;
    if (unit === 'min') progress = (task.duration_used || 0) / 60;
    else if (unit === 'reps' || unit === 'dose') progress = (task.xp_earned || 0) / xpPerUnit;
    else progress = 1; // Fallback for unknown units

    dailyProgressMap.set(key, (dailyProgressMap.get(key) || 0) + progress);
  });

  const processedHabits = (habits || [])
    .filter(h => h.is_visible)
    .map(h => {
    const initialHabit = initialHabitsMap.get(h.habit_key);
    const dailyProgress = dailyProgressMap.get(h.habit_key) || 0;
    const dailyGoal = h.current_daily_goal;
    
    const isScheduledForToday = h.days_of_week ? h.days_of_week.includes(currentDayOfWeek) : true;

    let isWithinWindow = true;
    if (h.window_start && h.window_end) {
      const now = new Date();
      const start = parse(h.window_start, 'HH:mm', now);
      const end = parse(h.window_end, 'HH:mm', now);
      isWithinWindow = isWithinInterval(now, { start, end });
    }

    const weeklyCompletions = Array.from(weeklyCompletionMap.keys())
      .filter(k => k.startsWith(`${h.habit_key}_`)).length;

    // Growth Metrics
    const plateauRequired = h.plateau_days_required;
    const daysInPlateau = differenceInDays(new Date(), new Date(h.last_plateau_start_date));
    const daysRemainingInPlateau = Math.max(0, plateauRequired - h.completions_in_plateau);

    return {
      key: h.habit_key,
      name: h.name || initialHabit?.name || h.habit_key.charAt(0).toUpperCase() + h.habit_key.slice(1), // Use name from DB
      dailyGoal, 
      dailyProgress, 
      isComplete: dailyProgress >= dailyGoal,
      momentum: h.momentum_level, 
      longTermGoal: h.long_term_goal,
      lifetimeProgress: h.unit === 'min' ? Math.round((h.lifetime_progress || 0) / 60) : (h.lifetime_progress || 0), // Use unit from DB
      unit: h.unit || '', // Use unit from DB
      xpPerUnit: h.xp_per_unit || 0, // Use xp_per_unit from DB
      energyCostPerUnit: h.energy_cost_per_unit || 0, // Use energy_cost_per_unit from DB
      is_frozen: h.is_frozen, 
      is_fixed: h.is_fixed,
      category: h.category || 'daily',
      is_trial_mode: h.is_trial_mode,
      frequency_per_week: h.frequency_per_week,
      weekly_completions: weeklyCompletions,
      weekly_goal: dailyGoal * h.frequency_per_week,
      is_visible: h.is_visible,
      isScheduledForToday: isScheduledForToday,
      isWithinWindow,
      window_start: h.window_start,
      window_end: h.window_end,
      auto_chunking: h.auto_chunking ?? true,
      enable_chunks: h.enable_chunks,
      num_chunks: h.num_chunks,
      chunk_duration: h.chunk_duration,
      growth_stats: {
        completions: h.completions_in_plateau,
        required: plateauRequired,
        daysRemaining: daysRemainingInPlateau,
        phase: h.growth_phase
      }
    };
  });

  const calculateTotals = (tasks: any[]) => {
    const totals = { pushups: 0, meditation: 0 };
    tasks.forEach(t => {
      const userHabit = habits?.find(h => h.habit_key === t.original_source);
      const unit = userHabit?.unit || initialHabitsMap.get(t.original_source)?.unit || 'min';
      const xpPerUnit = userHabit?.xp_per_unit || initialHabitsMap.get(t.original_source)?.xpPerUnit || 1;

      if (t.original_source === 'pushups') totals.pushups += (t.xp_earned || 0) / xpPerUnit; // Convert XP back to reps
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
    totalJourneyDays: processedHabits[0]?.longTermGoal || 365,
    habits: processedHabits,
    neurodivergentMode: profile?.neurodivergent_mode || false,
    weeklySummary: { 
      activeDays: new Set((completedThisWeek || []).map(t => startOfDay(new Date(t.completed_at)).toISOString())).size,
      pushups: { current: currentWeekTotals.pushups, previous: previousWeekTotals.pushups },
      meditation: { current: currentWeekTotals.meditation, previous: previousWeekTotals.meditation },
    },
    patterns: { streak: profile?.daily_streak || 0, totalSessions: totalSessions || 0, consistency, bestTime: bestTime || '—' },
    lastActiveText: profile?.last_active_at ? formatDistanceToNowStrict(new Date(profile.last_active_at), { addSuffix: true }) : 'Never',
    firstName: profile?.first_name || null, lastName: profile?.last_name || null,
    tip: randomTip || null, xp: profile?.xp || 0, level: profile?.level || 1, averageDailyTasks: totalSessions && totalDaysSinceStart > 0 ? (totalSessions / totalDaysSinceStart).toFixed(1) : '0.0',
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