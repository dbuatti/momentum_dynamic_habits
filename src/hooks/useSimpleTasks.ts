import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [tasks, setTasks] = useState<SimpleTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tasksData, error: tasksError } = await supabase
      .from('simple_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      setLoading(false);
      return;
    }

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

    setTasks(tasksWithProgress);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const templates = [
      { user_id: user.id, name: 'Pushups', task_type: 'count', current_value: 1, increment_value: 1 },
      { user_id: user.id, name: 'Be Still', task_type: 'time', current_value: 300, increment_value: 60 },
      { user_id: user.id, name: 'Walking', task_type: 'time', current_value: 600, increment_value: 300 },
      { user_id: user.id, name: 'Duolingo', task_type: 'time', current_value: 180, increment_value: 60 },
      { user_id: user.id, name: 'Reading', task_type: 'time', current_value: 300, increment_value: 300 }
    ];

    const { error } = await supabase.from('simple_tasks').insert(templates);
    if (error) {
      console.error('Error creating templates:', error);
    } else {
      await fetchTasks();
    }
  };

  const completeTask = async (taskId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentCompletions = task.current_progress;
    const shouldIncrease = currentCompletions + 1 >= STABILITY_THRESHOLD;
    const newValue = shouldIncrease ? task.current_value + task.increment_value : task.current_value;

    const { error: logError } = await supabase.from('simple_task_logs').insert({
      task_id: taskId,
      user_id: user.id,
      value_at_completion: task.current_value,
      increased: shouldIncrease
    });

    if (logError) {
      console.error('Error logging completion:', logError);
      return;
    }

    if (shouldIncrease) {
      await supabase
        .from('simple_tasks')
        .update({ current_value: newValue, updated_at: new Date().toISOString() })
        .eq('id', taskId);
    }

    await fetchTasks();

    return { 
      increased: shouldIncrease, 
      newValue, 
      progress: shouldIncrease ? 0 : currentCompletions + 1,
      threshold: STABILITY_THRESHOLD 
    };
  };

  return { tasks, loading, createTemplates, completeTask, refresh: fetchTasks };
}