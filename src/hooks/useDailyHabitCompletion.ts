import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

const fetchDailyCompletion = async (userId: string, habitKey: string) => {
  // 1. Fetch profile to get timezone
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching profile for daily completion:', profileError);
    // Fallback to UTC if profile fails, but this is less accurate
  }
  
  const timezone = profile?.timezone || 'UTC';

  // 2. Use the timezone-aware RPC to get today's completed tasks for this habit
  const { data: completedToday, error } = await supabase.rpc('get_completed_tasks_today', { 
    p_user_id: userId, 
    p_timezone: timezone 
  });

  if (error) throw error;

  // 3. Filter the results for the specific habit key
  const habitCompletions = (completedToday || []).filter(task => task.original_source === habitKey);

  // For fixed goal habits (like teeth brushing, medication) where goal is 1, 
  // any count >= 1 means it's completed.
  return habitCompletions.length >= 1;
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