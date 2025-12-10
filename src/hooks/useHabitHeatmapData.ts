import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { format, subMonths } from 'date-fns';

export const useHabitHeatmapData = () => {
  const { session } = useSession();
  const userId = session?.user?.id;

  const fetchHeatmapData = async () => {
    if (!userId) throw new Error('User not authenticated');

    const threeMonthsAgo = subMonths(new Date(), 3);
    
    const { data, error } = await supabase
      .from('completedtasks')
      .select('completed_at')
      .eq('user_id', userId)
      .gte('completed_at', threeMonthsAgo.toISOString());

    if (error) throw error;

    // Group by date
    const completionMap = new Map<string, number>();
    
    data.forEach(task => {
      const date = format(new Date(task.completed_at), 'yyyy-MM-dd');
      completionMap.set(date, (completionMap.get(date) || 0) + 1);
    });

    return Array.from(completionMap.entries()).map(([date, count]) => ({
      date,
      count
    }));
  };

  return useQuery({
    queryKey: ['habitHeatmapData', userId],
    queryFn: fetchHeatmapData,
    enabled: !!userId,
  });
};