import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useSession } from '@/contexts/SessionContext';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { session } = useSession();

  React.useEffect(() => {
    // If user somehow navigates here without being logged in, redirect to login
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  const handleFlowComplete = () => {
    onComplete();
  };

  return (
    <div className="w-full">
      <OnboardingFlow onComplete={handleFlowComplete} />
    </div>
  );
};

export default Onboarding;