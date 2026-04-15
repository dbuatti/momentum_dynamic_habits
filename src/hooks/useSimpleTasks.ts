import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { getTodayDateString } from '@/utils/time-utils';
import { isSameDay, differenceInDays, parseISO } from 'date-fns';

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
}

const STABILITY_THRESHOLD = 3; 

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

      // Get timezone-aware boundaries for today
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
        // --- DECAY LOGIC START ---
        // Only check for decay if the task is incremental and hasn't been updated today
        const lastUpdate = parseISO(task.updated_at);
        const todayStart = parseISO(todayStartTime);
        
        if (task.increment_value > 0 && lastUpdate < todayStart) {
          // Fetch the latest completion log for this task
          const { data: lastLog } = await supabase
            .from('simple_task_logs')
            .select('completed_at')
            .eq('task_id', task.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastLog) {
            const lastCompletionDate = parseISO(lastLog.completed_at);
            
            // Get the boundaries for the day of the last completion to find when that "day" ended
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
              
              // Calculate missed days: full 24h periods between the end of the last successful day and the start of today
              const diffMs = todayStart.getTime() - lastDayEndTime.getTime();
              const missedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

              if (missedDays > 0) {
                const decayAmount = task.increment_value * missedDays;
                // Ensure value doesn't drop below the increment value (minimum viable habit)
                const newValue = Math.max(task.increment_value, task.current_value - decayAmount);
                
                if (newValue !== task.current_value) {
                  await supabase
                    .from('simple_tasks')
                    .update({ 
                      current_value: newValue, 
                      updated_at: new Date().toISOString() 
                    })
                    .eq('id', task.id);
                  
                  // Update local object for immediate UI consistency
                  task.current_value = newValue;
                }
              }
            }
          }
        }
        // --- DECAY LOGIC END ---

        // Stability progress (logs for current value)
        const { count: stabilityCount } = await supabase
          .from('simple_task_logs')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', task.id)
          .eq('value_at_completion', task.current_value);
        
        // Daily completion check using timezone-aware boundaries
        const { count: dailyCount } = await supabase
          .from('simple_task_logs')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', task.id)
          .gte('completed_at', todayStartTime)
          .lt('completed_at', todayEndTime);
        
        return {
          ...task,
          current_progress: stabilityCount || 0,
          completed_today: (dailyCount || 0) > 0
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

      const currentCompletions = task.current_progress;
      const shouldIncrease = task.increment_value > 0 && currentCompletions + 1 >= STABILITY_THRESHOLD;
      const newValue = shouldIncrease ? task.current_value + task.increment_value : task.current_value;

      const { error: logError } = await supabase.from('simple_task_logs').insert({
        task_id: taskId,
        user_id: userId,
        value_at_completion: task.current_value,
        increased: shouldIncrease
      });

      if (logError) throw logError;

      if (shouldIncrease) {
        const { error: updateError } = await supabase
          .from('simple_tasks')
          .update({ current_value: newValue, updated_at: new Date().toISOString() })
          .eq('id', taskId);
        if (updateError) throw updateError;
      } else {
        // Even if not increasing, update updated_at to mark that we've interacted with it today
        await supabase
          .from('simple_tasks')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', taskId);
      }

      return { 
        increased: shouldIncrease, 
        newValue, 
        progress: shouldIncrease ? 0 : currentCompletions + 1,
        threshold: STABILITY_THRESHOLD 
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