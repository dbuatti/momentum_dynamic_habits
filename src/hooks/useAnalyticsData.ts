"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { startOfWeek, format, startOfDay, eachDayOfInterval, isSameDay, subWeeks } from 'date-fns';
import { calculateHabitLevel } from '@/utils/habit-leveling';

interface SimpleTask {
  id: string;
  name: string;
  task_type: 'count' | 'time';
  current_value: number;
  increment_value: number;
}

interface SimpleTaskLog {
  task_id: string;
  completed_at: string;
  value_at_completion: number;
}

interface TaskAnalyticsSummary {
  task: SimpleTask & {
    habit_xp: number;
    habit_level: number;
    unit: string;
  };
  totalCompletions: number;
  completionRate: number;
  weeklyCompletions: { [weekStart: string]: number };
}

interface AnalyticsData {
  tasks: TaskAnalyticsSummary[];
  overallWeeklySummary: {
    activeDays: number;
    streak: number;
    consistency: number;
  };
  bestTime: string;
  weeklyXp: { weekStart: string; xp: number }[];
}

const fetchAnalyticsData = async ({ userId, timeframe }: { userId: string; timeframe: string }): Promise<AnalyticsData> => {
  const today = new Date();
  let startDateFilter: Date;

  switch (timeframe) {
    case '4_weeks': startDateFilter = subWeeks(today, 4); break;
    case '12_weeks': startDateFilter = subWeeks(today, 12); break;
    default: startDateFilter = subWeeks(today, 8); break;
  }

  const [
    { data: profile },
    { data: simpleTasks },
    { data: taskLogs },
    { data: bestTime }
  ] = await Promise.all([
    supabase.from('profiles').select('daily_streak, timezone').eq('id', userId).single(),
    supabase.from('simple_tasks').select('*').eq('user_id', userId).eq('is_active', true),
    supabase.from('simple_task_logs').select('*').eq('user_id', userId).gte('completed_at', startDateFilter.toISOString()),
    supabase.rpc('get_best_time', { p_user_id: userId }),
  ]);

  const logs = (taskLogs || []) as SimpleTaskLog[];
  const tasks = (simpleTasks || []) as SimpleTask[];

  const processedTasks: TaskAnalyticsSummary[] = tasks.map(t => {
    const taskLogs = logs.filter(l => l.task_id === t.id);
    
    // Calculate XP: Sum of values at completion
    const xp = taskLogs.reduce((sum, log) => sum + (log.value_at_completion || 0), 0);
    const level = calculateHabitLevel(xp);
    const unit = t.task_type === 'time' ? 'sec' : 'reps';

    // Weekly grouping
    const weeklyCompletions: { [weekStart: string]: number } = {};
    taskLogs.forEach(log => {
      const weekStart = format(startOfWeek(new Date(log.completed_at), { weekStartsOn: 0 }), 'yyyy-MM-dd');
      weeklyCompletions[weekStart] = (weeklyCompletions[weekStart] || 0) + 1;
    });

    // Completion Rate
    const intervalStart = startOfDay(startDateFilter);
    const intervalEnd = startOfDay(today);
    const daysInInterval = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
    const completedDays = daysInInterval.filter(day => 
      taskLogs.some(l => isSameDay(new Date(l.completed_at), day))
    ).length;

    return {
      task: {
        ...t,
        habit_xp: xp,
        habit_level: level,
        unit
      },
      totalCompletions: taskLogs.length,
      completionRate: Math.round((completedDays / daysInInterval.length) * 100),
      weeklyCompletions
    };
  });

  // Weekly XP (Sum of values in logs)
  const weeklyXpMap = new Map<string, number>();
  logs.forEach(log => {
    const weekStart = format(startOfWeek(new Date(log.completed_at), { weekStartsOn: 0 }), 'yyyy-MM-dd');
    const currentXp = weeklyXpMap.get(weekStart) || 0;
    weeklyXpMap.set(weekStart, currentXp + (log.value_at_completion || 0));
  });

  const weeklyXp = Array.from(weeklyXpMap.entries())
    .map(([weekStart, xp]) => ({ weekStart, xp }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  const activeDaysCount = new Set(logs.map(l => format(new Date(l.completed_at), 'yyyy-MM-dd'))).size;

  return {
    tasks: processedTasks,
    overallWeeklySummary: {
      activeDays: activeDaysCount,
      streak: profile?.daily_streak || 0,
      consistency: 0, // Calculated in component
    },
    bestTime: bestTime || '—',
    weeklyXp
  };
};

export const useAnalyticsData = (timeframe: string) => {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery<AnalyticsData, Error>({
    queryKey: ['analyticsData', userId, timeframe],
    queryFn: () => fetchAnalyticsData({ userId: userId!, timeframe }),
    enabled: !!userId,
  });
};