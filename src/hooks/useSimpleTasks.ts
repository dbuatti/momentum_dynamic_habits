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

    // Intelligent increase: 50% chance
    const shouldIncrease = Math.random() > 0.5;
    const newValue = shouldIncrease ? task.current_value + task.increment_value : task.current_value;

    // Log completion
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

    // Update task value if increased
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

    return { increased: shouldIncrease, newValue };
  };

  return { tasks, loading, createTemplates, completeTask, refresh: fetchTasks };
}
