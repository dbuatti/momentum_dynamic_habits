import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export const useOnboardingCheck = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const checkOnboardingStatus = useCallback(async () => {
    setIsLoading(true);
    if (!session?.user?.id) {
      setIsOnboarded(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, timezone')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is expected for new users
        console.error('Error checking profile:', error);
        setIsOnboarded(false);
        return;
      }

      if (profile?.first_name && profile?.last_name) {
        setIsOnboarded(true);
      } else {
        setIsOnboarded(false);
      }
    } catch (error) {
      console.error('Error during onboarding check:', error);
      setIsOnboarded(false);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [session, checkOnboardingStatus]);

  const refetch = useCallback(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  return { isLoading, isOnboarded, refetch };
};