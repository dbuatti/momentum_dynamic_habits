import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { differenceInDays } from 'date-fns';
import { initialHabits } from '@/lib/habit-data';
import { UserHabitRecord } from '@/types/habit';

const fetchJourneyData = async (userId: string) => {
  const profilePromise = supabase.from('profiles').select('journey_start_date, daily_streak, timezone, default_auto_schedule_start_time, default_auto_schedule_end_time, first_name, last_name, neurodivergent_mode').eq('id', userId).single();
  const habitsPromise = supabase.from('user_habits').select('*, dependent_on_habit_id, anchor_practice').eq('user_id', userId); // Fetch all user habits including anchor_practice

  const allBadgesPromise = supabase.from('badges').select('id, name, icon_name, requirement_type, requirement_value, habit_key');
  const achievedBadgesPromise = supabase.from('user_badges').select('badge_id').eq('user_id', userId);
  const bestTimePromise = supabase.rpc('get_best_time', { p_user_id: userId });

  const [
    { data: profile, error: profileError },
    { data: habits, error: habitsError },
    { data: allBadges, error: allBadgesError },
    { data: achievedBadges, error: achievedBadgesError },
    { data: bestTime, error: bestTimeError },
  ] = await Promise.all([ profilePromise, habitsPromise, allBadgesPromise, achievedBadgesPromise, bestTimePromise]);

  if (profileError || habitsError || allBadgesError || achievedBadgesError) {
    throw new Error('Failed to fetch essential journey data');
  }

  const initialHabitsMap = new Map(initialHabits.map(h => [h.id, h]));
  
  const allUserHabits: UserHabitRecord[] = (habits || []).map(h => {
    const initialHabit = initialHabitsMap.get(h.habit_key);
    const rawLifetimeProgress = h.lifetime_progress || 0;
    
    // Use unit from DB for conversion
    const uiLifetimeProgress = h.unit === 'min' ? 
      Math.round(rawLifetimeProgress / 60) : rawLifetimeProgress;
      
    return {
      ...h,
      lifetime_progress: uiLifetimeProgress,
      raw_lifetime_progress: rawLifetimeProgress, // Keep raw for calculations
      unit: h.unit || '', // Use unit from DB
      category: h.category || 'daily',
      anchor_practice: h.anchor_practice, // Include anchor_practice
    };
  });

  const visibleHabits = allUserHabits.filter(h => h.is_visible);

  const startDate = profile?.journey_start_date ? new Date(profile.journey_start_date) : null;
  const meditationHabit = visibleHabits?.find(h => h.habit_key === 'meditation');
  const totalJourneyDays = (meditationHabit && startDate) ? 
    differenceInDays(new Date(meditationHabit.target_completion_date), startDate) : 0;

  return {
    profile,
    allHabits: allUserHabits,
    habits: visibleHabits,
    allBadges,
    achievedBadges,
    bestTime: bestTime || '—',
    totalJourneyDays
  };
};

export const useJourneyData = () => {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['journeyData', userId],
    queryFn: () => fetchJourneyData(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};