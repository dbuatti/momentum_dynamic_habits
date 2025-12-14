import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { startOfDay, endOfDay, differenceInDays, startOfWeek, endOfWeek, subWeeks, addMonths, subDays, formatDistanceToNowStrict } from 'date-fns';
import { initialHabits } from '@/lib/habit-data';
import { useInitializeMissingHabits } from './useInitializeMissingHabits';
import { useEffect, useRef } from 'react';

const fetchDashboardData = async (userId: string) => {
  const profilePromise = supabase.from('profiles').select('journey_start_date, daily_streak, last_active_at, first_name, last_name, timezone, xp, level, tasks_completed_today').eq('id', userId).single();
  const habitsPromise = supabase.from('user_habits').select('*').eq('user_id', userId);
  const allBadgesPromise = supabase.from('badges').select('id, name, icon_name, requirement_type, requirement_value, habit_key');
  const achievedBadgesPromise = supabase.from('user_badges').select('badge_id').eq('user_id', userId);
  const today = new Date();
  const completedTodayPromise = supabase.from('completedtasks')
    .select('original_source, duration_used, xp_earned')
    .eq('user_id', userId)
    .gte('completed_at', startOfDay(today).toISOString())
    .lte('completed_at', endOfDay(today).toISOString());
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
    { data: profile, error: profileError },
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
    profilePromise,
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

  if (profileError) console.error('Error fetching profile for dashboard:', profileError);
  if (habitsError) console.error('Error fetching habits for dashboard:', habitsError);
  if (allBadgesError) console.error('Error fetching all badges for dashboard:', allBadgesError);
  if (achievedBadgesError) console.error('Error fetching achieved badges for dashboard:', achievedBadgesError);
  if (completedTodayError) console.error('Error fetching completed tasks today for dashboard:', completedTodayError);
  if (completedThisWeekError) console.error('Error fetching completed tasks this week for dashboard:', completedThisWeekError);
  if (completedLastWeekError) console.error('Error fetching completed tasks last week for dashboard:', completedLastWeekError);
  if (totalCompletedError) console.error('Error fetching total completed tasks for dashboard:', totalCompletedError);
  if (distinctDaysError) console.error('Error fetching distinct completed days for dashboard:', distinctDaysError);
  if (bestTimeError) console.error('Error fetching best time for dashboard:', bestTimeError);
  if (randomReviewQuestionError) console.error('Error fetching random review question for dashboard:', randomReviewQuestionError);
  if (randomTipError) console.error('Error fetching random tip for dashboard:', randomTipError);

  // Throw a general error if essential data is missing, but allow bestTime, reviewQuestion, tip to be optional
  if (profileError || habitsError || allBadgesError || achievedBadgesError || completedTodayError || completedThisWeekError || completedLastWeekError || totalCompletedError || distinctDaysError) {
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
      console.error(`Error fetching completion history for ${h.habit_key}:`, error);
      return { habitKey: h.habit_key, daysCompletedLast7Days: 0 };
    }
    const distinctCompletionDays = new Set(completions.map(c => startOfDay(new Date(c.completed_at)).toISOString())).size;
    return { habitKey: h.habit_key, daysCompletedLast7Days: distinctCompletionDays };
  });

  const habitCompletionHistory = await Promise.all(habitCompletionHistoryPromises);
  const habitCompletionMap = new Map(habitCompletionHistory.map(item => [item.habitKey, item.daysCompletedLast7Days]));

  const startDate = profile?.journey_start_date ? new Date(profile.journey_start_date) : new Date();
  const daysActive = differenceInDays(startOfDay(new Date()), startOfDay(startDate)) + 1;
  
  // Corrected logic for daily progress calculation
  const dailyProgressMap = new Map<string, number>();
  (completedToday || []).forEach(task => {
    const key = task.original_source;
    const habitConfig = initialHabitsMap.get(key);
    
    let progress = 0;
    
    if (habitConfig?.type === 'time' && habitConfig?.unit === 'min') {
      // Time-based habit: duration_used is in seconds, convert to minutes
      progress = (task.duration_used || 0) / 60;
    } else if (habitConfig?.type === 'count') {
      // Count-based habit: Calculate count from xp_earned and xpPerUnit
      // Since xp_earned = value * xpPerUnit, value = xp_earned / xpPerUnit
      const xpPerUnit = habitConfig.xpPerUnit || 1;
      progress = (task.xp_earned || 0) / xpPerUnit;
    } else {
      // Fallback for unknown types
      progress = 1;
    }
    
    dailyProgressMap.set(key, (dailyProgressMap.get(key) || 0) + progress);
  });

  // Define habits that should maintain fixed goals
  const fixedGoalHabits = ['teeth_brushing', 'medication', 'housework', 'projectwork'];
  const processedHabits = (habits || []).map(h => {
    const initialHabit = initialHabitsMap.get(h.habit_key);
    const unit = initialHabit?.unit || '';
    const xpPerUnit = initialHabit?.xpPerUnit || 0;
    const energyCostPerUnit = initialHabit?.energyCostPerUnit || 0;
    const dailyProgress = dailyProgressMap.get(h.habit_key) || 0;
    // For fixed goal habits, always use the initial target goal as the daily goal
    const dailyGoal = fixedGoalHabits.includes(h.habit_key) ? 
      (initialHabit?.targetGoal || h.current_daily_goal) : h.current_daily_goal;
      
    // Raw progress is always in the DB unit (seconds for time, reps for count)
    const rawLifetimeProgress = h.lifetime_progress || 0;
    
    // UI-friendly progress (minutes for time, reps for count)
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
      lifetimeProgress: uiLifetimeProgress, // UI friendly
      rawLifetimeProgress: rawLifetimeProgress, // DB friendly for badge checks
      unit: unit,
      xpPerUnit: xpPerUnit,
      energyCostPerUnit: energyCostPerUnit,
      daysCompletedLast7Days: habitCompletionMap.get(h.habit_key) || 0,
    };
  });

  // Add default values for new habits that might not exist in the database yet
  const habitKeysInDb = new Set(processedHabits.map(h => h.key));
  const newHabits = initialHabits.filter(h => !habitKeysInDb.has(h.id) && (h.id === 'teeth_brushing' || h.id === 'medication'));
  newHabits.forEach(habit => {
    processedHabits.push({
      key: habit.id,
      name: habit.name,
      dailyGoal: habit.targetGoal,
      dailyProgress: 0,
      isComplete: false,
      momentum: 'Building',
      longTermGoal: habit.id === 'teeth_brushing' ? 365 : 365, // Annual goal
      lifetimeProgress: 0,
      rawLifetimeProgress: 0, // Default raw progress
      unit: habit.unit,
      xpPerUnit: habit.xpPerUnit,
      energyCostPerUnit: habit.energyCostPerUnit,
      daysCompletedLast7Days: 0,
    });
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

  const achievedBadgeIds = new Set((achievedBadges || []).map(b => b.badge_id));
  const nextBadgeData = (allBadges || []).find(b => !achievedBadgeIds.has(b.id)) || null;
  let nextBadgeProgress = { progressValue: 0, value: 0, unit: '' };
  if (nextBadgeData) {
    const reqType = nextBadgeData.requirement_type;
    const reqValue = nextBadgeData.requirement_value;
    if (reqType === 'days_active') {
      const progress = Math.min((daysActive / reqValue) * 100, 100);
      nextBadgeProgress = {
        progressValue: progress,
        value: Math.max(0, reqValue - daysActive),
        unit: 'days left'
      };
    } else if (reqType === 'streak') {
      const currentStreak = profile?.daily_streak || 0;
      const progress = Math.min((currentStreak / reqValue) * 100, 100);
      nextBadgeProgress = {
        progressValue: progress,
        value: Math.max(0, reqValue - currentStreak),
        unit: 'days left'
      };
    } else if (reqType === 'lifetime_progress') {
      const habit = processedHabits.find(h => h.key === nextBadgeData.habit_key);
      if (habit) {
        // Use raw progress (seconds/reps) against DB requirement value (seconds/reps)
        const currentProgressRaw = habit.rawLifetimeProgress; 
        const progress = Math.min((currentProgressRaw / reqValue) * 100, 100);
        
        // Calculate remaining value in UI units (minutes/reps)
        const remainingRaw = Math.max(0, reqValue - currentProgressRaw);
        
        let remainingUIValue = remainingRaw;
        let unit = `${habit.unit} left`;
        
        // If it's a time habit, convert remaining seconds back to minutes for display
        if (habit.unit === 'min') {
            remainingUIValue = Math.ceil(remainingRaw / 60); // Use ceil to show remaining minutes
            unit = 'min left';
        } else {
            unit = `${habit.unit} left`;
        }

        nextBadgeProgress = {
          progressValue: progress,
          value: remainingUIValue,
          unit: unit
        };
      }
    }
  }

  const totalDaysSinceStart = differenceInDays(startOfDay(new Date()), startOfDay(startDate)) + 1;
  const rawConsistency = totalSessions && totalDaysSinceStart > 0 && typeof distinctDays === 'number' ? 
    distinctDays / totalDaysSinceStart : 0;
  const consistency = Math.round(Math.min(rawConsistency, 1) * 100);

  const lastActiveAt = profile?.last_active_at ? new Date(profile.last_active_at) : null;
  const lastActiveText = lastActiveAt ? 
    formatDistanceToNowStrict(lastActiveAt, { addSuffix: true }) : 'Never';

  const averageDailyTasks = totalSessions && daysActive > 0 ? 
    (totalSessions / daysActive).toFixed(1) : '0.0';

  // Find the meditation habit to calculate totalJourneyDays consistently
  const meditationHabit = habits?.find(h => h.habit_key === 'meditation');
  const totalJourneyDays = meditationHabit && profile?.journey_start_date ? 
    differenceInDays(new Date(meditationHabit.target_completion_date), new Date(profile.journey_start_date)) : 0;

  return {
    daysActive,
    totalJourneyDays: totalJourneyDays, // Use the consistently calculated totalJourneyDays
    daysToNextMonth: differenceInDays(addMonths(startDate, 1), new Date()),
    habits: processedHabits,
    weeklySummary,
    patterns: {
      streak: profile?.daily_streak || 0,
      totalSessions: totalSessions || 0,
      consistency: consistency,
      bestTime: bestTime || '—', // Fallback for bestTime
    },
    nextBadge: nextBadgeData ? { ...nextBadgeData, progress: nextBadgeProgress } : null,
    lastActiveText,
    firstName: profile?.first_name || null,
    lastName: profile?.last_name || null,
    reviewQuestion: randomReviewQuestion || null,
    tip: randomTip || null,
    timezone: profile?.timezone || 'UTC',
    tasksCompletedToday: profile?.tasks_completed_today || 0,
    xp: Math.max(0, profile?.xp || 0), // Ensure XP is non-negative
    level: profile?.level || 1,
    averageDailyTasks,
  };
};

export const useDashboardData = () => {
  const { session } = useSession();
  const userId = session?.user?.id;
  const { mutate: initializeMissingHabits } = useInitializeMissingHabits();

  // Initialize missing habits when the hook is used
  // This will only run once per session
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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};