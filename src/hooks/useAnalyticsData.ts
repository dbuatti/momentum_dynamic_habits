"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { startOfWeek, endOfWeek, subWeeks, format, startOfDay, endOfDay, eachDayOfInterval, isSameDay, isBefore, isAfter } from 'date-fns';
import { UserHabitRecord, ProcessedUserHabit } from '@/types/habit'; // Import ProcessedUserHabit

interface CompletedTask {
  id: string;
  task_name: string;
  original_source: string;
  duration_used: number | null;
  xp_earned: number;
  energy_cost: number;
  completed_at: string;
  note: string | null;
}

interface Reflection {
  id: string;
  reflection_date: string;
  prompt: string | null;
  notes: string | null;
  xp_bonus_awarded: boolean;
  created_at: string;
}

interface HabitAnalyticsSummary {
  habit: ProcessedUserHabit; // Use ProcessedUserHabit here
  dailyProgress: number; // Added
  isComplete: boolean;   // Added
  totalCompletions: number;
  totalDurationOrReps: number;
  averageDurationOrReps: number;
  completionRate: number; // Percentage of scheduled days completed
  capsuleCompletionRate: number; // Percentage of capsules completed
  missedDays: string[]; // Dates when habit was scheduled but not completed
  weeklyCompletions: { [weekStart: string]: number };
  weeklyDurationOrReps: { [weekStart: string]: number };
  weeklyCapsuleCompletions: { [weekStart: string]: number };
  weeklyCapsuleTotals: { [weekStart: string]: number };
}

interface AnalyticsData {
  profile: {
    neurodivergent_mode: boolean;
    timezone: string;
    first_name: string | null;
    last_name: string | null;
  };
  habits: HabitAnalyticsSummary[];
  overallWeeklySummary: {
    totalCompletions: number;
    activeDays: number;
    streak: number;
    consistency: number;
  };
  latestReflection: Reflection | null;
  reflectionPrompt: string;
  bestTime: string; // Added bestTime
}

const fetchAnalyticsData = async (userId: string): Promise<AnalyticsData> => {
  const today = new Date();
  const eightWeeksAgo = subWeeks(today, 8); // Data for last 8 weeks

  const [
    { data: profile, error: profileError },
    { data: userHabits, error: userHabitsError },
    { data: completedTasks, error: completedTasksError },
    { data: habitCapsules, error: habitCapsulesError },
    { data: reflections, error: reflectionsError },
    { data: bestTime, error: bestTimeError }, // Fetch bestTime
  ] = await Promise.all([
    supabase.from('profiles').select('neurodivergent_mode, timezone, first_name, last_name, daily_streak').eq('id', userId).single(),
    supabase.from('user_habits').select('*, dependent_on_habit_id, anchor_practice, carryover_value').eq('user_id', userId), // Fetch carryover_value
    supabase.from('completedtasks').select('*').eq('user_id', userId).gte('completed_at', eightWeeksAgo.toISOString()),
    supabase.from('habit_capsules').select('*').eq('user_id', userId).gte('created_at', format(eightWeeksAgo, 'yyyy-MM-dd')),
    supabase.from('reflections').select('*').eq('user_id', userId).order('reflection_date', { ascending: false }).limit(1),
    supabase.rpc('get_best_time', { p_user_id: userId }), // Fetch bestTime
  ]);

  if (profileError || userHabitsError || completedTasksError || habitCapsulesError || reflectionsError || bestTimeError) {
    console.error('Error fetching analytics data:', profileError || userHabitsError || completedTasksError || habitCapsulesError || reflectionsError || bestTimeError);
    throw new Error('Failed to fetch analytics data');
  }

  const neurodivergentMode = profile?.neurodivergent_mode || false;
  const timezone = profile?.timezone || 'UTC';
  const dailyStreak = profile?.daily_streak || 0;

  const processedHabits: HabitAnalyticsSummary[] = (userHabits || []).map(habit => {
    const habitCompletedTasks = (completedTasks || []).filter(t => t.original_source === habit.habit_key);
    const habitCapsulesData = (habitCapsules || []).filter(c => c.habit_key === habit.habit_key);

    let totalCompletions = 0;
    let totalDurationOrReps = 0;
    let totalCapsules = 0;
    let completedCapsules = 0;

    // Calculate total completions and duration/reps
    habitCompletedTasks.forEach(task => {
      totalCompletions++;
      if (habit.unit === 'min') {
        totalDurationOrReps += (task.duration_used || 0) / 60;
      } else if (habit.unit === 'reps' || habit.unit === 'dose') {
        totalDurationOrReps += (task.xp_earned || 0) / (habit.xp_per_unit || 1);
      }
    });

    const averageDurationOrReps = totalCompletions > 0 ? totalDurationOrReps / totalCompletions : 0;

    // Calculate capsule completion rate
    const capsulesByDate = new Map<string, { total: number; completed: number }>();
    habitCapsulesData.forEach(capsule => {
      const date = format(new Date(capsule.created_at), 'yyyy-MM-dd');
      if (!capsulesByDate.has(date)) {
        capsulesByDate.set(date, { total: 0, completed: 0 });
      }
      const current = capsulesByDate.get(date)!;
      current.total++;
      if (capsule.is_completed) {
        current.completed++;
      }
    });

    capsulesByDate.forEach(data => {
      totalCapsules += data.total;
      completedCapsules += data.completed;
    });

    const capsuleCompletionRate = totalCapsules > 0 ? (completedCapsules / totalCapsules) * 100 : 0;

    // Calculate completion rate (scheduled vs. completed days) and missed days
    const scheduledDays: Date[] = [];
    const completedDays: Date[] = [];

    const intervalStart = startOfDay(eightWeeksAgo);
    const intervalEnd = startOfDay(today);
    
    eachDayOfInterval({ start: intervalStart, end: intervalEnd }).forEach(day => {
      const dayOfWeek = day.getDay();
      if (habit.days_of_week?.includes(dayOfWeek)) {
        scheduledDays.push(day);
        const isCompletedOnDay = habitCompletedTasks.some(t => isSameDay(new Date(t.completed_at), day));
        if (isCompletedOnDay) {
          completedDays.push(day);
        }
      }
    });

    const completionRate = scheduledDays.length > 0 ? (completedDays.length / scheduledDays.length) * 100 : 0;
    const missedDays = scheduledDays.filter(day => !completedDays.some(cDay => isSameDay(cDay, day))).map(d => format(d, 'yyyy-MM-dd'));

    // Calculate weekly completions and duration/reps
    const weeklyCompletions: { [weekStart: string]: number } = {};
    const weeklyDurationOrReps: { [weekStart: string]: number } = {};
    const weeklyCapsuleCompletions: { [weekStart: string]: number } = {};
    const weeklyCapsuleTotals: { [weekStart: string]: number } = {};

    eachDayOfInterval({ start: eightWeeksAgo, end: today }).forEach(day => {
      const weekStart = format(startOfWeek(day, { weekStartsOn: 0 }), 'yyyy-MM-dd'); // Sunday as start of week
      if (!weeklyCompletions[weekStart]) {
        weeklyCompletions[weekStart] = 0;
        weeklyDurationOrReps[weekStart] = 0;
        weeklyCapsuleCompletions[weekStart] = 0;
        weeklyCapsuleTotals[weekStart] = 0;
      }
    });

    habitCompletedTasks.forEach(task => {
      const weekStart = format(startOfWeek(new Date(task.completed_at), { weekStartsOn: 0 }), 'yyyy-MM-dd');
      weeklyCompletions[weekStart] = (weeklyCompletions[weekStart] || 0) + 1;
      if (habit.unit === 'min') {
        weeklyDurationOrReps[weekStart] = (weeklyDurationOrReps[weekStart] || 0) + ((task.duration_used || 0) / 60);
      } else if (habit.unit === 'reps' || habit.unit === 'dose') {
        weeklyDurationOrReps[weekStart] = (weeklyDurationOrReps[weekStart] || 0) + ((task.xp_earned || 0) / (habit.xp_per_unit || 1));
      }
    });

    habitCapsulesData.forEach(capsule => {
      const weekStart = format(startOfWeek(new Date(capsule.created_at), { weekStartsOn: 0 }), 'yyyy-MM-dd');
      weeklyCapsuleTotals[weekStart] = (weeklyCapsuleTotals[weekStart] || 0) + 1;
      if (capsule.is_completed) {
        weeklyCapsuleCompletions[weekStart] = (weeklyCapsuleCompletions[weekStart] || 0) + 1;
      }
    });

    // Calculate dailyProgress and isComplete for the current day
    let dailyProgress = 0;
    const todayCompletedTasks = (completedTasks || []).filter(t => t.original_source === habit.habit_key && isSameDay(new Date(t.completed_at), today));
    todayCompletedTasks.forEach(task => {
      if (habit.unit === 'min') {
        dailyProgress += (task.duration_used || 0) / 60;
      } else if (habit.unit === 'reps' || habit.unit === 'dose') {
        dailyProgress += (task.xp_earned || 0) / (habit.xp_per_unit || 1);
      } else {
        dailyProgress += 1; // For count-based habits without specific xp_per_unit
      }
    });
    
    // Apply carryover to the daily goal for display and chunking
    const adjustedDailyGoal = habit.current_daily_goal + (habit.carryover_value || 0);
    const isComplete = dailyProgress >= adjustedDailyGoal;


    return {
      habit: {
        ...habit,
        key: habit.habit_key, // Add key property
        dailyGoal: habit.current_daily_goal, // Base daily goal
        adjustedDailyGoal: adjustedDailyGoal, // Daily goal including carryover
        xpPerUnit: habit.xp_per_unit,
        energyCostPerUnit: habit.energy_cost_per_unit,
        weekly_goal: habit.current_daily_goal * habit.frequency_per_week,
        growth_stats: {
          completions: habit.completions_in_plateau,
          required: habit.plateau_days_required,
          daysRemaining: Math.max(0, habit.plateau_days_required - habit.completions_in_plateau),
          phase: habit.growth_phase
        },
        isLockedByDependency: false, // Analytics doesn't need this, but for type consistency
        carryoverValue: habit.carryover_value || 0,
      },
      dailyProgress, // Added
      isComplete,    // Added
      totalCompletions,
      totalDurationOrReps: Math.round(totalDurationOrReps),
      averageDurationOrReps: Math.round(averageDurationOrReps),
      completionRate: Math.round(completionRate),
      capsuleCompletionRate: Math.round(capsuleCompletionRate),
      missedDays,
      weeklyCompletions,
      weeklyDurationOrReps,
      weeklyCapsuleCompletions,
      weeklyCapsuleTotals,
    };
  });

  // Overall Weekly Summary
  const overallWeeklySummary = {
    totalCompletions: completedTasks?.length || 0,
    activeDays: new Set((completedTasks || []).map(t => format(new Date(t.completed_at), 'yyyy-MM-dd'))).size,
    streak: dailyStreak,
    consistency: 0, // Will be calculated in Analytics.tsx
  };

  // Reflection prompt logic
  const reflectionPrompt = "Which habits felt easiest this week? Where did you struggle and why?";
  const latestReflection = (reflections && reflections.length > 0) ? reflections[0] : null;

  return {
    profile: {
      neurodivergent_mode: neurodivergentMode,
      timezone: timezone,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
    },
    habits: processedHabits,
    overallWeeklySummary,
    latestReflection,
    reflectionPrompt,
    bestTime: bestTime || '—', // Include bestTime
  };
};

export const useAnalyticsData = () => {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery<AnalyticsData, Error>({
    queryKey: ['analyticsData', userId],
    queryFn: () => fetchAnalyticsData(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};