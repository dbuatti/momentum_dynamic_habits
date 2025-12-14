import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export const useOnboardingCheck = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has completed onboarding by checking if they have profile data
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, timezone')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error checking profile:', error);
          setIsLoading(false);
          return;
        }

        // If profile exists but has no name, redirect to onboarding
        if (!profile?.first_name || !profile?.last_name) {
          navigate('/onboarding');
        }
      } catch (error) {
        console.error('Error during onboarding check:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [session, navigate]);

  return { isLoading };
};