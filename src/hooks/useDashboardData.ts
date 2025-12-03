import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { startOfDay, endOfDay, differenceInDays, startOfWeek, endOfWeek, subWeeks, addMonths, subDays, formatDistanceToNowStrict } from 'date-fns';
import { initialHabits } from '@/lib/habit-data'; // Import initialHabits

const fetchDashboardData = async (userId: string) => {
    // 1. Fetch raw data from Supabase
    const profilePromise = supabase.from('profiles').select('journey_start_date, daily_streak, last_active_at, first_name, timezone').eq('id', userId).single();
    const habitsPromise = supabase.from('user_habits').select('*').eq('user_id', userId);
    const allBadgesPromise = supabase.from('badges').select('id, name, icon_name, requirement_type, requirement_value, habit_key');
    const achievedBadgesPromise = supabase.from('user_badges').select('badge_id').eq('user_id', userId);
    
    const today = new Date();
    const completedTodayPromise = supabase.from('completedtasks')
        .select('original_source, duration_used')
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

    const totalCompletedPromise = supabase.from('completedtasks').select('id', { count: 'exact', head: true }).eq('user_id', userId);
    
    const distinctDaysPromise = supabase.rpc('get_distinct_completed_days', { p_user_id: userId });
    const bestTimePromise = supabase.rpc('get_best_time', { p_user_id: userId });

    // Fetch a random review question
    const randomReviewQuestionPromise = supabase
        .from('review_questions')
        .select('question, answer')
        .order('created_at', { ascending: false }) // Order by created_at to get recent, then limit 1 and offset random
        .limit(1)
        .single();

    // Fetch a random tip
    const randomTipPromise = supabase
        .from('tips')
        .select('content, related_habit_key')
        .order('created_at', { ascending: false }) // Order by created_at to get recent, then limit 1 and offset random
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
        profilePromise, habitsPromise, allBadgesPromise, achievedBadgesPromise,
        completedTodayPromise, completedThisWeekPromise, completedLastWeekPromise, totalCompletedPromise,
        distinctDaysPromise, bestTimePromise, randomReviewQuestionPromise, randomTipPromise
    ]);

    if (profileError || habitsError || allBadgesError || achievedBadgesError || completedTodayError || completedThisWeekError || completedLastWeekError || totalCompletedError || distinctDaysError || bestTimeError || randomReviewQuestionError || randomTipError) {
        console.error('Error fetching dashboard data:', profileError || habitsError || allBadgesError || achievedBadgesError || completedTodayError || completedThisWeekError || completedLastWeekError || totalCompletedError || distinctDaysError || bestTimeError || randomReviewQuestionError || randomTipError);
        throw new Error('Failed to fetch dashboard data');
    }

    // Create a map for initial habit data to easily get units
    const initialHabitsMap = new Map(initialHabits.map(h => [h.id, h]));

    // Fetch 7-day completion history for each habit
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


    // 2. Process and calculate derived data
    const startDate = profile?.journey_start_date ? new Date(profile.journey_start_date) : new Date();
    const daysActive = differenceInDays(startOfDay(new Date()), startOfDay(startDate)) + 1;

    const dailyProgressMap = new Map<string, number>();
    (completedToday || []).forEach(task => {
        const key = task.original_source;
        // Use duration_used for time-based habits, and count as 1 for count-based habits (or actual value if available)
        const progress = initialHabitsMap.get(key)?.type === 'time' ? (task.duration_used || 0) : 1; // Assuming 1 rep per log for count-based
        dailyProgressMap.set(key, (dailyProgressMap.get(key) || 0) + progress);
    });

    const processedHabits = (habits || []).map(h => {
        const initialHabit = initialHabitsMap.get(h.habit_key);
        const unit = initialHabit?.unit || ''; // Get unit from initialHabits
        const dailyProgress = dailyProgressMap.get(h.habit_key) || 0;
        const dailyGoal = h.current_daily_goal;

        return {
            key: h.habit_key,
            name: initialHabit?.name || h.habit_key.charAt(0).toUpperCase() + h.habit_key.slice(1),
            dailyGoal: dailyGoal,
            dailyProgress: dailyProgress,
            isComplete: dailyProgress >= dailyGoal,
            momentum: h.momentum_level,
            longTermGoal: h.long_term_goal,
            lifetimeProgress: h.lifetime_progress,
            unit: unit, // Use the fetched unit
            daysCompletedLast7Days: habitCompletionMap.get(h.habit_key) || 0,
        };
    });

    const weeklySummary = {
        pushups: { current: 0, previous: 0 },
        meditation: { current: 0, previous: 0 },
        activeDays: new Set((completedThisWeek || []).map(t => startOfDay(new Date(t.completed_at)).toISOString())).size
    };
    (completedThisWeek || []).forEach(task => {
        if (task.original_source === 'pushups') weeklySummary.pushups.current += 1;
        if (task.original_source === 'meditation') weeklySummary.meditation.current += task.duration_used || 0;
    });
    (completedLastWeek || []).forEach(task => {
        if (task.original_source === 'pushups') weeklySummary.pushups.previous += 1;
        if (task.original_source === 'meditation') weeklySummary.meditation.previous += task.duration_used || 0;
    });

    const achievedBadgeIds = new Set((achievedBadges || []).map(b => b.badge_id));
    const nextBadgeData = (allBadges || []).find(b => !achievedBadgeIds.has(b.id)) || null;

    let nextBadgeProgress = { progressValue: 0, value: 0, unit: '' };

    if (nextBadgeData) {
        const reqType = nextBadgeData.requirement_type;
        const reqValue = nextBadgeData.requirement_value;

        if (reqType === 'days_active') {
            const progress = Math.min((daysActive / reqValue) * 100, 100);
            nextBadgeProgress = { progressValue: progress, value: Math.max(0, reqValue - daysActive), unit: 'days left' };
        } else if (reqType === 'streak') {
            const currentStreak = profile?.daily_streak || 0;
            const progress = Math.min((currentStreak / reqValue) * 100, 100);
            nextBadgeProgress = { progressValue: progress, value: Math.max(0, reqValue - currentStreak), unit: 'days left' };
        } else if (reqType === 'lifetime_progress') {
            const habit = processedHabits.find(h => h.key === nextBadgeData.habit_key);
            if (habit) {
                const currentProgress = habit.lifetimeProgress;
                const progress = Math.min((currentProgress / reqValue) * 100, 100);
                const remaining = Math.max(0, reqValue - currentProgress);
                const unit = habit.unit === 'm' ? 'min left' : `${habit.key} left`;
                nextBadgeProgress = { progressValue: progress, value: remaining, unit: unit };
            }
        }
    }

    const totalJourneyDays = habits && habits.length > 0 ? differenceInDays(new Date(habits[0].target_completion_date), startDate) : 0;
    const nextMonthDate = addMonths(startDate, 1);
    const daysToNextMonth = differenceInDays(nextMonthDate, new Date());
    
    const totalDaysSinceStart = differenceInDays(startOfDay(new Date()), startOfDay(startDate)) + 1;
    const rawConsistency = totalDaysSinceStart > 0 && typeof distinctDays === 'number' ? distinctDays / totalDaysSinceStart : 0;
    const consistency = Math.round(Math.min(rawConsistency, 1) * 100);

    const lastActiveAt = profile?.last_active_at ? new Date(profile.last_active_at) : null;
    const lastActiveText = lastActiveAt ? formatDistanceToNowStrict(lastActiveAt, { addSuffix: true }) : 'Never';

    return {
        daysActive,
        totalJourneyDays,
        daysToNextMonth,
        habits: processedHabits,
        weeklySummary,
        patterns: {
            streak: profile?.daily_streak || 0,
            totalSessions: totalSessions || 0,
            consistency: consistency,
            bestTime: bestTime || '—',
        },
        nextBadge: nextBadgeData ? { ...nextBadgeData, progress: nextBadgeProgress } : null,
        lastActiveText,
        firstName: profile?.first_name || null,
        reviewQuestion: randomReviewQuestion || null,
        tip: randomTip || null,
        timezone: profile?.timezone || 'UTC',
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