import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SimpleTask {
  id: string;
  name: string;
  task_type: 'count' | 'time';
  current_value: number;
  increment_value: number;
  is_active: boolean;
}

const STABILITY_THRESHOLD = 3; // ADHD-friendly: Prove it 3 times before growing

export function useSimpleTasks() {
  const [tasks, setTasks] = useState<SimpleTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('simple_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
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
      { user_id: user.id, name: 'Be Still', task_type: 'time', current_value: 5, increment_value: 5 }
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

    // 1. Check how many times this task has been completed at the CURRENT value
    const { count, error: countError } = await supabase
      .from('simple_task_logs')
      .select('*', { count: 'exact', head: true })
      .eq('task_id', taskId)
      .eq('value_at_completion', task.current_value);

    if (countError) {
      console.error('Error checking stability:', countError);
      return;
    }

    const currentCompletions = count || 0;
    const shouldIncrease = currentCompletions + 1 >= STABILITY_THRESHOLD;
    const newValue = shouldIncrease ? task.current_value + task.increment_value : task.current_value;

    // 2. Log completion
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

    // 3. Update task value if threshold reached
    if (shouldIncrease) {
      const { error: updateError } = await supabase
        .from('simple_tasks')
        .update({ current_value: newValue, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (updateError) {
        console.error('Error updating task:', updateError);
      } else {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, current_value: newValue } : t));
      }
    }

    return { 
      increased: shouldIncrease, 
      newValue, 
      progress: shouldIncrease ? 0 : currentCompletions + 1,
      threshold: STABILITY_THRESHOLD 
    };
  };

  return { tasks, loading, createTemplates, completeTask, refresh: fetchTasks };
}