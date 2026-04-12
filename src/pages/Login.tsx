import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useOnboardingCheck } from '@/hooks/useOnboardingCheck';

const Login = () => {
  const { session, loading: isSessionLoading } = useSession();
  const { isOnboarded, isLoading: isOnboardingCheckLoading } = useOnboardingCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSessionLoading && !isOnboardingCheckLoading) {
      if (session) {
        if (isOnboarded) {
          navigate('/', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      }
    }
  }, [session, isSessionLoading, isOnboarded, isOnboardingCheckLoading, navigate]);

  if (isSessionLoading || isOnboardingCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center space-y-6">
          <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-white/40 flex items-center justify-center animate-pulse">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-6xl font-black tracking-tighter text-primary uppercase italic">
              Momentum
            </h2>
            <p className="text-xl font-bold text-muted-foreground/60">
              Your bubbly growth coach
            </p>
          </div>
        </div>

        <div className="p-2">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              style: {
                button: {
                  borderRadius: '2rem',
                  padding: '1.25rem 1rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '1rem',
                  border: 'none',
                  boxShadow: '0 10px 20px -5px rgba(255, 120, 0, 0.2)',
                },
                input: {
                  borderRadius: '1.5rem',
                  padding: '1rem 1.25rem',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  fontSize: '1rem',
                },
                label: {
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  color: 'rgba(0,0,0,0.4)',
                  marginBottom: '0.5rem',
                }
              }
            }}
            providers={['google']}
            theme="light"
          />
        </div>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
          Small steps lead to big changes
        </p>
      </div>
    </div>
  );
};

export default Login;