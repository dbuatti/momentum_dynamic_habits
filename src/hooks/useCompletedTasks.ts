"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { startOfDay, endOfDay } from 'date-fns';

interface CompletedTask {
  id: string;
  task_name: string;
  original_source: string;
  duration_used: number | null;
  xp_earned: number;
  energy_cost: number;
  completed_at: string;
  note: string | null; // Added note field
}

const fetchCompletedTasks = async (userId: string): Promise<CompletedTask[]> => {
  // Note: We fetch ALL completed tasks for the history page.
  
  const { data, error } = await supabase
    .from('completedtasks')
    .select('id, task_name, original_source, duration_used, xp_earned, energy_cost, completed_at, note') // Select note
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching completed tasks:', error);
    throw new Error('Failed to fetch completed tasks');
  }

  return data;
};

export const useCompletedTasks = () => {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery<CompletedTask[], Error>({
    queryKey: ['completedTasks', userId],
    queryFn: () => fetchCompletedTasks(userId!),
    enabled: !!userId,
  });
};