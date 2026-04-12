import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export interface SimpleTask {
  id: string;
  name: string;
  task_type: 'count' | 'time';
  current_value: number;
  increment_value: number;
  is_active: boolean;
  current_progress: number; 
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

      const { data: tasksData, error: tasksError } = await supabase
        .from('simple_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (tasksError) throw tasksError;

      const tasksWithProgress = await Promise.all((tasksData || []).map(async (task) => {
        const { count } = await supabase
          .from('simple_task_logs')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', task.id)
          .eq('value_at_completion', task.current_value);
        
        return {
          ...task,
          current_progress: count || 0
        };
      }));

      return tasksWithProgress as SimpleTask[];
    },
    enabled: !!userId,
  });

  const createTemplatesMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      const templates = [
        { user_id: userId, name: 'Pushups', task_type: 'count', current_value: 1, increment_value: 1 },
        { user_id: userId, name: 'Be Still', task_type: 'time', current_value: 300, increment_value: 60 },
        { user_id: userId, name: 'Walking', task_type: 'time', current_value: 600, increment_value: 300 },
        { user_id: userId, name: 'Duolingo', task_type: 'time', current_value: 180, increment_value: 60 },
        { user_id: userId, name: 'Reading', task_type: 'time', current_value: 300, increment_value: 300 },
        { user_id: userId, name: 'Shower', task_type: 'time', current_value: 900, increment_value: 0 },
        { user_id: userId, name: 'Brush Teeth (Morning)', task_type: 'time', current_value: 120, increment_value: 0 },
        { user_id: userId, name: 'Brush Teeth (Evening)', task_type: 'time', current_value: 120, increment_value: 0 }
      ];

      const { error } = await supabase.from('simple_tasks').insert(templates);
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
      // Also invalidate dashboard data if it exists
      queryClient.invalidateQueries({ queryKey: ['dashboardData', userId] });
    }
  });

  return { 
    tasks, 
    loading, 
    createTemplates: createTemplatesMutation.mutateAsync, 
    completeTask: completeTaskMutation.mutateAsync,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['simpleTasks', userId] })
  };
}