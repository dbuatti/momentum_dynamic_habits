import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

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

    if (profileError || habitsError || allBadgesError || achievedBadgesError || bestTimeError) {
        console.error('Error fetching journey data:', profileError || habitsError || allBadgesError || achievedBadgesError || bestTimeError);
        throw new Error('Failed to fetch journey data');
    }

    return { profile, habits, allBadges, achievedBadges, bestTime }; // Return bestTime
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