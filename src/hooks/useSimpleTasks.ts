import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { getTodayDateString } from '@/utils/time-utils';
import { isSameDay, differenceInDays, parseISO } from 'date-fns';
import { calculateHabitLevel } from '@/utils/habit-leveling';

export interface SimpleTask {
  id: string;
  name: string;
  task_type: 'count' | 'time';
  current_value: number;
  increment_value: number;
  is_active: boolean;
  current_progress: number; 
  completed_today: boolean;
  last_skipped_at: string | null;
  updated_at: string;
  habit_xp: number;
  habit_level: number;
}

export function useSimpleTasks() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey: ['simpleTasks', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', userId).single();
      const tz = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const todayStr = getTodayDateString(tz);

      const { data: boundaries, error: boundaryError } = await supabase.rpc('get_day_boundaries', {
        p_user_id: userId,
        p_target_date: todayStr
      });

      if (boundaryError) throw boundaryError;
      const { start_time: todayStartTime, end_time: todayEndTime } = boundaries[0];

      const { data: tasksData, error: tasksError } = await supabase
        .from('simple_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (tasksError) throw tasksError;

      const tasksWithProgress = await Promise.all((tasksData || []).map(async (task) => {
        // --- DECAY LOGIC ---
        const lastUpdate = parseISO(task.updated_at);
        const todayStart = parseISO(todayStartTime);
        
        if (task.increment_value > 0 && lastUpdate < todayStart) {
          const { data: lastLog } = await supabase
            .from('simple_task_logs')
            .select('completed_at')
            .eq('task_id', task.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastLog) {
            const lastCompletionDate = parseISO(lastLog.completed_at);
            const lastLogDateStr = new Intl.DateTimeFormat('en-CA', {
              timeZone: tz,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).format(lastCompletionDate);

            const { data: lastBoundaries } = await supabase.rpc('get_day_boundaries', {
              p_user_id: userId,
              p_target_date: lastLogDateStr
            });

            if (lastBoundaries && lastBoundaries[0]) {
              const lastDayEndTime = parseISO(lastBoundaries[0].end_time);
              const diffMs = todayStart.getTime() - lastDayEndTime.getTime();
              const missedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

              if (missedDays > 0) {
                const decayAmount = task.increment_value * missedDays;
                const newValue = Math.max(task.increment_value, task.current_value - decayAmount);
                
                if (newValue !== task.current_value) {
                  await supabase
                    .from('simple_tasks')
                    .update({ 
                      current_value: newValue, 
                      updated_at: new Date().toISOString() 
                    })
                    .eq('id', task.id);
                  task.current_value = newValue;
                }
              }
            }
          }
        }

        // Stability progress (logs for current value) - kept for internal tracking but not used for increase
        const { count: stabilityCount } = await supabase
          .from('simple_task_logs')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', task.id)
          .eq('value_at_completion', task.current_value);
        
        // Total XP (Sum of values in logs)
        const { data: logsForXp } = await supabase
          .from('simple_task_logs')
          .select('value_at_completion')
          .eq('task_id', task.id);

        const habit_xp = (logsForXp || []).reduce((sum, log) => sum + (log.value_at_completion || 0), 0);
        const habit_level = calculateHabitLevel(habit_xp);

        // Daily completion check
        const { count: dailyCount } = await supabase
          .from('simple_task_logs')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', task.id)
          .gte('completed_at', todayStartTime)
          .lt('completed_at', todayEndTime);

        return {
          ...task,
          current_progress: stabilityCount || 0,
          completed_today: (dailyCount || 0) > 0,
          habit_xp,
          habit_level
        };
      }));

      return tasksWithProgress as SimpleTask[];
    },
    enabled: !!userId,
  });

  const skipTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from('simple_tasks')
        .update({ last_skipped_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simpleTasks', userId] });
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!userId) return;

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // 1. Calculate current level
      const currentLevel = task.habit_level;

      // 2. Log the completion
      const { error: logError } = await supabase.from('simple_task_logs').insert({
        task_id: taskId,
        user_id: userId,
        value_at_completion: task.current_value,
        increased: false // We'll update this if needed
      });

      if (logError) throw logError;

      // 3. Calculate new level after log
      const { data: logsAfter } = await supabase
        .from('simple_task_logs')
        .select('value_at_completion')
        .eq('task_id', taskId);
      
      const newXp = (logsAfter || []).reduce((sum, log) => sum + (log.value_at_completion || 0), 0);
      const newLevel = calculateHabitLevel(newXp);
      
      const leveledUp = newLevel > currentLevel;
      const shouldIncrease = leveledUp && task.increment_value > 0;
      const newValue = shouldIncrease ? task.current_value + task.increment_value : task.current_value;

      // 4. Update task if leveled up
      if (shouldIncrease) {
        const { error: updateError } = await supabase
          .from('simple_tasks')
          .update({ 
            current_value: newValue, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', taskId);
        if (updateError) throw updateError;
        
        // Mark the log as the one that triggered the increase
        await supabase
          .from('simple_task_logs')
          .update({ increased: true })
          .eq('task_id', taskId)
          .order('completed_at', { ascending: false })
          .limit(1);
      } else {
        await supabase
          .from('simple_tasks')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', taskId);
      }

      return { 
        increased: shouldIncrease, 
        newValue, 
        newLevel,
        totalXp: newXp
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simpleTasks', userId] });
    }
  });

  return { 
    tasks, 
    loading, 
    completeTask: completeTaskMutation.mutateAsync,
    skipTask: skipTaskMutation.mutateAsync,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['simpleTasks', userId] })
  };
}