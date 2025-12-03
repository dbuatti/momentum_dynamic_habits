import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { subDays, addDays } from 'date-fns';

// --- MOCK DATA for development ---
const MOCK_BADGES = [
    { id: '1', name: 'First Step', icon_name: 'Star' },
    { id: '2', name: 'Momentum Builder', icon_name: 'Flame' },
    { id: '3', name: 'Week Warrior', icon_name: 'Shield' },
    { id: '4', name: 'Consistent Crusader', icon_name: 'Target' },
    { id: '5', name: 'Monthly Master', icon_name: 'Crown' },
    { id: '6', name: 'Unstoppable', icon_name: 'Zap' },
    { id: '7', name: 'Legendary', icon_name: 'Trophy' },
    { id: '8', name: 'Century Club', icon_name: 'Sparkles' },
    { id: '9', name: 'Iron Arms', icon_name: 'Mountain' },
    { id: '10', name: 'Push-up Champion', icon_name: 'Award' },
    { id: '11', name: 'Zen Beginner', icon_name: 'Sun' },
    { id: '12', name: 'Zen Practitioner', icon_name: 'Moon' },
    { id: '13', name: 'Zen Master', icon_name: 'Heart' },
];

const useMockJourneyData = () => {
    const journeyStartDate = subDays(new Date(), 7);
    const targetCompletionDate = addDays(new Date(), 331);

    const data = {
        profile: { journey_start_date: journeyStartDate.toISOString() },
        habits: [
            { 
                habit_key: 'pushups', 
                current_daily_goal: 8, 
                long_term_goal: 200, 
                momentum_level: 'Building', 
                lifetime_progress: 62, 
                target_completion_date: targetCompletionDate.toISOString() 
            },
            { 
                habit_key: 'meditation', 
                current_daily_goal: 4, 
                long_term_goal: 120, 
                momentum_level: 'Strong', 
                lifetime_progress: 28, 
                target_completion_date: targetCompletionDate.toISOString() 
            },
        ],
        allBadges: MOCK_BADGES,
        achievedBadges: [{ badge_id: '1' }],
    };

    return { data, isLoading: false, isError: false };
};

// --- REAL DATA fetching ---
const fetchJourneyData = async (userId: string) => {
    const profilePromise = supabase.from('profiles').select('journey_start_date').eq('id', userId).single();
    const habitsPromise = supabase.from('user_habits').select('*').eq('user_id', userId);
    const allBadgesPromise = supabase.from('badges').select('id, name, icon_name');
    const achievedBadgesPromise = supabase.from('user_badges').select('badge_id').eq('user_id', userId);

    const [
        { data: profile, error: profileError },
        { data: habits, error: habitsError },
        { data: allBadges, error: allBadgesError },
        { data: achievedBadges, error: achievedBadgesError },
    ] = await Promise.all([profilePromise, habitsPromise, allBadgesPromise, achievedBadgesPromise]);

    if (profileError || habitsError || allBadgesError || achievedBadgesError) {
        console.error('Error fetching journey data:', profileError || habitsError || allBadgesError || achievedBadgesError);
        throw new Error('Failed to fetch journey data');
    }

    return { profile, habits, allBadges, achievedBadges };
};

export const useJourneyData = () => {
    const { session } = useSession();

    // Use mock data in development to bypass login and for stable UI previews
    if (import.meta.env.DEV) {
        return useMockJourneyData();
    }

    const userId = session?.user?.id;

    return useQuery({
        queryKey: ['journeyData', userId],
        queryFn: () => fetchJourneyData(userId!),
        enabled: !!userId,
    });
};