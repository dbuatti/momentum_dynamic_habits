import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { startOfDay, endOfDay } from 'date-fns';

const fetchDailyCompletion = async (userId: string, habitKey: string) => {
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  const { count, error } = await supabase
    .from('completedtasks')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('original_source', habitKey)
    .gte('completed_at', todayStart)
    .lte('completed_at', todayEnd);

  if (error) throw error;

  // For fixed goal habits (like teeth brushing, medication) where goal is 1, 
  // any count >= 1 means it's completed.
  return (count || 0) >= 1;
};

export const useDailyHabitCompletion = (habitKey: string) => {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery<boolean, Error>({
    queryKey: ['dailyHabitCompletion', userId, habitKey],
    queryFn: () => fetchDailyCompletion(userId!, habitKey),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};