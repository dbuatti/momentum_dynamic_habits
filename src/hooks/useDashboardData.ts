import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { startOfDay, endOfDay, differenceInDays, startOfWeek, endOfWeek, subWeeks, addMonths, formatDistanceToNowStrict } from 'date-fns';

const fetchDashboardData = async (userId: string) => {
    // 1. Fetch raw data from Supabase
    const profilePromise = supabase.from('profiles').select('journey_start_date, daily_streak').eq('id', userId).single();
    const habitsPromise = supabase.from('user_habits').select('*').eq('user_id', userId);
    const allBadgesPromise = supabase.from('badges').select('id, name, icon_name');
    const achievedBadgesPromise = supabase.from('user_badges').select('badge_id').eq('user_id', userId);
    
    const today = new Date();
    const completedTodayPromise = supabase.from('completedtasks')
        .select('original_source, duration_used')
        .gte('completed_at', startOfDay(today).toISOString())
        .lte('completed_at', endOfDay(today).toISOString());

    const completedThisWeekPromise = supabase.from('completedtasks')
        .select('original_source, duration_used, completed_at')
        .gte('completed_at', startOfWeek(today).toISOString())
        .lte('completed_at', endOfWeek(today).toISOString());
    
    const completedLastWeekPromise = supabase.from('completedtasks')
        .select('original_source, duration_used')
        .gte('completed_at', startOfWeek(subWeeks(today, 1)).toISOString())
        .lte('completed_at', endOfWeek(subWeeks(today, 1)).toISOString());

    const totalCompletedPromise = supabase.from('completedtasks').select('id', { count: 'exact', head: true });

    const [
        { data: profile, error: profileError },
        { data: habits, error: habitsError },
        { data: allBadges, error: allBadgesError },
        { data: achievedBadges, error: achievedBadgesError },
        { data: completedToday, error: completedTodayError },
        { data: completedThisWeek, error: completedThisWeekError },
        { data: completedLastWeek, error: completedLastWeekError },
        { count: totalSessions, error: totalCompletedError },
    ] = await Promise.all([
        profilePromise, habitsPromise, allBadgesPromise, achievedBadgesPromise,
        completedTodayPromise, completedThisWeekPromise, completedLastWeekPromise, totalCompletedPromise
    ]);

    if (profileError || habitsError || allBadgesError || achievedBadgesError || completedTodayError || completedThisWeekError || completedLastWeekError || totalCompletedError) {
        console.error('Error fetching dashboard data:', profileError || habitsError || allBadgesError || achievedBadgesError || completedTodayError || completedThisWeekError || completedLastWeekError || totalCompletedError);
        throw new Error('Failed to fetch dashboard data');
    }

    // 2. Process and calculate derived data
    const startDate = profile?.journey_start_date ? new Date(profile.journey_start_date) : new Date();
    const daysActive = differenceInDays(startOfDay(new Date()), startOfDay(startDate)) + 1;

    const dailyProgressMap = new Map<string, number>();
    completedToday.forEach(task => {
        const key = task.original_source;
        const progress = key === 'meditation' ? (task.duration_used || 0) : 1;
        dailyProgressMap.set(key, (dailyProgressMap.get(key) || 0) + progress);
    });

    const processedHabits = habits.map(h => ({
        key: h.habit_key,
        name: h.habit_key.charAt(0).toUpperCase() + h.habit_key.slice(1),
        dailyGoal: h.current_daily_goal,
        dailyProgress: dailyProgressMap.get(h.habit_key) || 0,
        isComplete: (dailyProgressMap.get(h.habit_key) || 0) >= h.current_daily_goal,
        momentum: h.momentum_level,
        longTermGoal: h.long_term_goal,
        lifetimeProgress: h.lifetime_progress,
        unit: h.habit_key === 'meditation' ? 'm' : '',
    }));

    const weeklySummary = {
        pushups: { current: 0, previous: 0 },
        meditation: { current: 0, previous: 0 },
        activeDays: new Set(completedThisWeek.map(t => startOfDay(new Date(t.completed_at)).toISOString())).size
    };
    completedThisWeek.forEach(task => {
        if (task.original_source === 'pushups') weeklySummary.pushups.current += 1;
        if (task.original_source === 'meditation') weeklySummary.meditation.current += task.duration_used || 0;
    });
    completedLastWeek.forEach(task => {
        if (task.original_source === 'pushups') weeklySummary.pushups.previous += 1;
        if (task.original_source === 'meditation') weeklySummary.meditation.previous += task.duration_used || 0;
    });

    const achievedBadgeIds = new Set(achievedBadges.map(b => b.badge_id));
    const nextBadge = allBadges.find(b => !achievedBadgeIds.has(b.id)) || null;

    const totalJourneyDays = habits.length > 0 ? differenceInDays(new Date(habits[0].target_completion_date), startDate) : 0;
    const nextMonthDate = addMonths(startDate, 1);
    const daysToNextMonth = differenceInDays(nextMonthDate, new Date());

    return {
        daysActive,
        totalJourneyDays,
        daysToNextMonth,
        habits: processedHabits,
        weeklySummary,
        patterns: {
            streak: profile.daily_streak || 0,
            totalSessions: totalSessions || 0,
        },
        nextBadge,
    };
};

export const useDashboardData = () => {
    const { session } = useSession();
    const userId = session?.user?.id;

    return useQuery({
        queryKey: ['dashboardData', userId],
        queryFn: () => fetchDashboardData(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};