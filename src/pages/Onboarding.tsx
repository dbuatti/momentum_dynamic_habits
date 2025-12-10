import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useSession } from '@/contexts/SessionContext';

const Onboarding = () => {
  const navigate = useNavigate();
  const { session } = useSession();

  React.useEffect(() => {
    // If user somehow navigates here without being logged in, redirect to login
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  const handleComplete = () => {
    navigate('/');
  };

  return (
    <div className="w-full">
      <OnboardingFlow onComplete={handleComplete} />
    </div>
  );
};

export default Onboarding;