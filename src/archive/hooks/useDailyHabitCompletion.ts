import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { UserHabitRecord } from '@/types/habit'; // Import UserHabitRecord

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

  // Fetch the user habit data to get complete_on_finish and other details
  const { data: userHabitDataResult, error: userHabitFetchError } = await supabase
    .from('user_habits')
    .select('*')
    .eq('user_id', userId)
    .eq('habit_key', habitKey)
    .single();

  if (userHabitFetchError || !userHabitDataResult) {
    console.error('Error fetching user habit data for daily completion:', userHabitFetchError);
    throw userHabitFetchError || new Error(`Habit data not found for key: ${habitKey}`);
  }
  const userHabitData: UserHabitRecord = userHabitDataResult;

  // 2. Use the timezone-aware RPC to get today's completed tasks for this habit
  const { data: completedToday, error } = await supabase.rpc('get_completed_tasks_today', { 
    p_user_id: userId, 
    p_timezone: timezone 
  });

  if (error) throw error;

  // 3. Filter the results for the specific habit key
  const habitCompletions = (completedToday || []).filter(task => task.original_source === habitKey);

  // NEW LOGIC: If complete_on_finish is true, any logged task means it's complete for the day.
  if (userHabitData.complete_on_finish) {
    return habitCompletions.length >= 1;
  } else {
    // Existing logic for summing progress
    let totalProgressOnDay = 0;
    const xpPerUnit = userHabitData.xp_per_unit || (userHabitData.unit === 'min' ? 30 : 1);

    habitCompletions.forEach((task: any) => {
      if (userHabitData.measurement_type === 'timer') {
        totalProgressOnDay += (task.duration_used || 0) / 60;
      } else if (userHabitData.measurement_type === 'unit' || userHabitData.measurement_type === 'binary') {
        totalProgressOnDay += (task.xp_earned || 0) / xpPerUnit;
      } else {
        totalProgressOnDay += 1;
      }
    });
    const threshold = userHabitData.measurement_type === 'timer' ? 0.1 : 0.01;
    return totalProgressOnDay >= (userHabitData.current_daily_goal - threshold);
  }
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