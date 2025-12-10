import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { differenceInDays } from 'date-fns'; // Import differenceInDays

const fetchJourneyData = async (userId: string) => {
    const profilePromise = supabase.from('profiles').select('journey_start_date, daily_streak, meditation_sound, timezone, default_auto_schedule_start_time, default_auto_schedule_end_time, first_name, last_name').eq('id', userId).single();
    const habitsPromise = supabase.from('user_habits').select('*').eq('user_id', userId);
    const allBadgesPromise = supabase.from('badges').select('id, name, icon_name, requirement_type, requirement_value, habit_key');
    const achievedBadgesPromise = supabase.from('user_badges').select('badge_id').eq('user_id', userId);
    const bestTimePromise = supabase.rpc('get_best_time', { p_user_id: userId }); // Fetch best time

    const [
        { data: profile, error: profileError },
        { data: habits, error: habitsError },
        { data: allBadges, error: allBadgesError },
        { data: achievedBadges, error: achievedBadgesError },
        { data: bestTime, error: bestTimeError }, // Destructure bestTime
    ] = await Promise.all([profilePromise, habitsPromise, allBadgesPromise, achievedBadgesPromise, bestTimePromise]);

    if (profileError) console.error('Error fetching profile for journey:', profileError);
    if (habitsError) console.error('Error fetching habits for journey:', habitsError);
    if (allBadgesError) console.error('Error fetching all badges for journey:', allBadgesError);
    if (achievedBadgesError) console.error('Error fetching achieved badges for journey:', achievedBadgesError);
    if (bestTimeError) console.error('Error fetching best time for journey:', bestTimeError);

    // Throw a general error if essential data is missing, but allow bestTime to be optional
    if (profileError || habitsError || allBadgesError || achievedBadgesError) {
        throw new Error('Failed to fetch essential journey data');
    }

    // Calculate totalJourneyDays consistently
    const startDate = profile?.journey_start_date ? new Date(profile.journey_start_date) : null;
    const meditationHabit = habits?.find(h => h.habit_key === 'meditation');
    const totalJourneyDays = (meditationHabit && startDate)
      ? differenceInDays(new Date(meditationHabit.target_completion_date), startDate)
      : 0; // Ensure it's always a number

    return { profile, habits, allBadges, achievedBadges, bestTime: bestTime || '—', totalJourneyDays }; // Return totalJourneyDays
};

export const useJourneyData = () => {
    const { session } = useSession();
    const userId = session?.user?.id;

    return useQuery({
        queryKey: ['journeyData', userId],
        queryFn: () => fetchJourneyData(userId!),
        enabled: !!userId,
    });
};