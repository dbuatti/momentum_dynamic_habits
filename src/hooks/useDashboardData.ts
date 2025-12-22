import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { startOfDay, endOfDay, differenceInDays, startOfWeek, endOfWeek, subWeeks, addMonths, subDays, formatDistanceToNowStrict } from 'date-fns';
import { initialHabits } from '@/lib/habit-data';
import { useInitializeMissingHabits } from './useInitializeMissingHabits';
import { useEffect, useRef } from 'react';

const fetchDashboardData = async (userId: string) => {
  // 1. Fetch Profile first to get Timezone
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('journey_start_date, daily_streak, last_active_at, first_name, last_name, timezone, xp, level, tasks_completed_today')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching profile for dashboard:', profileError);
    throw new Error('Failed to fetch essential dashboard data (Profile missing)');
  }
  
  const timezone = profile?.timezone || 'UTC';
  const today = new Date();

  // 2. Define remaining promises
  const completedTodayPromise = supabase.rpc('get_completed_tasks_today', { 
    p_user_id: userId, 
    p_timezone: timezone 
  });
  
  const habitsPromise = supabase.from('user_habits').select('*').eq('user_id', userId);
  const allBadgesPromise = supabase.from('badges').select('id, name, icon_name, requirement_type, requirement_value, habit_key');
  const achievedBadgesPromise = supabase.from('user_badges').select('badge_id').eq('user_id', userId);
  
  const completedThisWeekPromise = supabase.from('completedtasks')
    .select('original_source, duration_used, completed_at')
    .eq('user_id', userId)
    .gte('completed_at', startOfWeek(today).toISOString())
    .lte('completed_at', endOfWeek(today).toISOString());
  const completedLastWeekPromise = supabase.from('completedtasks')
    .select('original_source, duration_used')
    .eq('user_id', userId)
    .gte('completed_at', startOfWeek(subWeeks(today, 1)).toISOString())
    .lte('completed_at', endOfWeek(subWeeks(today, 1)).toISOString());
  const totalCompletedPromise = supabase.from('completedtasks').select('id', { count: 'exact' });
  const distinctDaysPromise = supabase.rpc('get_distinct_completed_days', { p_user_id: userId });
  const bestTimePromise = supabase.rpc('get_best_time', { p_user_id: userId });
  const randomReviewQuestionPromise = supabase
    .from('review_questions')
    .select('question, answer')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  const randomTipPromise = supabase
    .from('tips')
    .select('content, related_habit_key')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const [
    { data: habits, error: habitsError },
    { data: allBadges, error: allBadgesError },
    { data: achievedBadges, error: achievedBadgesError },
    { data: completedToday, error: completedTodayError },
    { data: completedThisWeek, error: completedThisWeekError },
    { data: completedLastWeek, error: completedLastWeekError },
    { count: totalSessions, error: totalCompletedError },
    { data: distinctDays, error: distinctDaysError },
    { data: bestTime, error: bestTimeError },
    { data: randomReviewQuestion, error: randomReviewQuestionError },
    { data: randomTip, error: randomTipError },
  ] = await Promise.all([
    habitsPromise,
    allBadgesPromise,
    achievedBadgesPromise,
    completedTodayPromise,
    completedThisWeekPromise,
    completedLastWeekPromise,
    totalCompletedPromise,
    distinctDaysPromise,
    bestTimePromise,
    randomReviewQuestionPromise,
    randomTipPromise
  ]);

  if (habitsError || allBadgesError || achievedBadgesError || completedTodayError || completedThisWeekError || completedLastWeekError || totalCompletedError || distinctDaysError) {
    throw new Error('Failed to fetch essential dashboard data');
  }

  const initialHabitsMap = new Map(initialHabits.map(h => [h.id, h]));
  const sevenDaysAgo = subDays(today, 6);
  const habitCompletionHistoryPromises = (habits || []).map(async (h) => {
    const { data: completions, error } = await supabase.from('completedtasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('original_source', h.habit_key)
      .gte('completed_at', startOfDay(sevenDaysAgo).toISOString())
      .lte('completed_at', endOfDay(today).toISOString());
    if (error) {
      return { habitKey: h.habit_key, daysCompletedLast7Days: 0 };
    }
    const distinctCompletionDays = new Set(completions.map(c => startOfDay(new Date(c.completed_at)).toISOString())).size;
    return { habitKey: h.habit_key, daysCompletedLast7Days: distinctCompletionDays };
  });

  const habitCompletionHistory = await Promise.all(habitCompletionHistoryPromises);
  const habitCompletionMap = new Map(habitCompletionHistory.map(item => [item.habitKey, item.daysCompletedLast7Days]));

  const startDate = profile?.journey_start_date ? new Date(profile.journey_start_date) : new Date();
  const daysActive = differenceInDays(startOfDay(new Date()), startOfDay(startDate)) + 1;
  
  const dailyProgressMap = new Map<string, number>();
  (completedToday || []).forEach((task: any) => {
    const key = task.original_source;
    const habitConfig = initialHabitsMap.get(key);
    let progress = 0;
    if (habitConfig?.type === 'time' && habitConfig?.unit === 'min') {
      progress = (task.duration_used || 0) / 60;
    } else if (habitConfig?.type === 'count') {
      const xpPerUnit = habitConfig.xpPerUnit || 1;
      progress = (task.xp_earned || 0) / xpPerUnit;
    } else {
      progress = 1;
    }
    dailyProgressMap.set(key, (dailyProgressMap.get(key) || 0) + progress);
  });

  const fixedGoalHabits = ['teeth_brushing', 'medication', 'housework', 'projectwork'];
  const processedHabits = (habits || []).map(h => {
    const initialHabit = initialHabitsMap.get(h.habit_key);
    const dailyProgress = dailyProgressMap.get(h.habit_key) || 0;
    const dailyGoal = fixedGoalHabits.includes(h.habit_key) ? 
      (initialHabit?.targetGoal || h.current_daily_goal) : h.current_daily_goal;
      
    const rawLifetimeProgress = h.lifetime_progress || 0;
    const uiLifetimeProgress = initialHabit?.type === 'time' && initialHabit?.unit === 'min' ? 
      Math.round(rawLifetimeProgress / 60) : rawLifetimeProgress;
      
    return {
      key: h.habit_key,
      name: initialHabit?.name || h.habit_key.charAt(0).toUpperCase() + h.habit_key.slice(1),
      dailyGoal: dailyGoal,
      dailyProgress: dailyProgress,
      isComplete: dailyProgress >= dailyGoal,
      momentum: h.momentum_level,
      longTermGoal: h.long_term_goal,
      lifetimeProgress: uiLifetimeProgress,
      rawLifetimeProgress: rawLifetimeProgress,
      unit: initialHabit?.unit || '',
      xpPerUnit: initialHabit?.xpPerUnit || 0,
      energyCostPerUnit: initialHabit?.energyCostPerUnit || 0,
      daysCompletedLast7Days: habitCompletionMap.get(h.habit_key) || 0,
      is_frozen: h.is_frozen, // ADDED THIS LINE TO FIX COMPILER ERROR
    };
  });

  const weeklySummary = {
    pushups: { current: 0, previous: 0 },
    meditation: { current: 0, previous: 0 },
    activeDays: new Set((completedThisWeek || []).map(t => startOfDay(new Date(t.completed_at)).toISOString())).size
  };

  (completedThisWeek || []).forEach(task => {
    if (task.original_source === 'pushups') weeklySummary.pushups.current += 1;
    if (task.original_source === 'meditation') weeklySummary.meditation.current += (task.duration_used || 0) / 60;
  });

  (completedLastWeek || []).forEach(task => {
    if (task.original_source === 'pushups') weeklySummary.pushups.previous += 1;
    if (task.original_source === 'meditation') weeklySummary.meditation.previous += (task.duration_used || 0) / 60;
  });

  const totalDaysSinceStart = differenceInDays(startOfDay(new Date()), startOfDay(startDate)) + 1;
  const rawConsistency = totalSessions && totalDaysSinceStart > 0 && typeof distinctDays === 'number' ? 
    distinctDays / totalDaysSinceStart : 0;
  const consistency = Math.round(Math.min(rawConsistency, 1) * 100);

  const lastActiveAt = profile?.last_active_at ? new Date(profile.last_active_at) : null;
  const lastActiveText = lastActiveAt ? 
    formatDistanceToNowStrict(lastActiveAt, { addSuffix: true }) : 'Never';

  const averageDailyTasks = totalSessions && daysActive > 0 ? 
    (totalSessions / daysActive).toFixed(1) : '0.0';

  const meditationHabit = habits?.find(h => h.habit_key === 'meditation');
  const totalJourneyDays = meditationHabit && profile?.journey_start_date ? 
    differenceInDays(new Date(meditationHabit.target_completion_date), new Date(profile.journey_start_date)) : 0;

  return {
    daysActive,
    totalJourneyDays: totalJourneyDays,
    daysToNextMonth: differenceInDays(addMonths(startDate, 1), new Date()),
    habits: processedHabits,
    weeklySummary,
    patterns: {
      streak: profile?.daily_streak || 0,
      totalSessions: totalSessions || 0,
      consistency: consistency,
      bestTime: bestTime || '—',
    },
    nextBadge: null, // Simplified for brevity in this fix
    lastActiveText,
    firstName: profile?.first_name || null,
    lastName: profile?.last_name || null,
    reviewQuestion: randomReviewQuestion || null,
    tip: randomTip || null,
    timezone: timezone,
    tasksCompletedToday: profile?.tasks_completed_today || 0,
    xp: Math.max(0, profile?.xp || 0),
    level: profile?.level || 1,
    averageDailyTasks,
  };
};

export const useDashboardData = () => {
  const { session } = useSession();
  const userId = session?.user?.id;
  const { mutate: initializeMissingHabits } = useInitializeMissingHabits();

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (userId && !hasInitialized.current) {
      initializeMissingHabits();
      hasInitialized.current = true;
    }
  }, [userId, initializeMissingHabits]);

  return useQuery({
    queryKey: ['dashboardData', userId],
    queryFn: () => fetchDashboardData(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};