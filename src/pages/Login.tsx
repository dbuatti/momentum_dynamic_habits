import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center animate-pulse">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">
              Momentum
            </h2>
            <p className="text-lg font-bold text-muted-foreground">
              Your bubbly growth coach
            </p>
          </div>
        </div>

        <Card className="p-8 rounded-[2.5rem] shadow-2xl border-4 border-primary/5 bg-card/50 backdrop-blur-sm">
          <CardHeader className="p-0 mb-8">
            <h3 className="text-xl font-black text-center uppercase tracking-widest text-primary">Welcome Back!</h3>
          </CardHeader>
          <CardContent className="p-0">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: {
                    borderRadius: '1.5rem',
                    padding: '0.875rem 1rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.875rem',
                  },
                  input: {
                    borderRadius: '1.25rem',
                    padding: '0.875rem 1rem',
                    border: '2px solid transparent',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                  }
                }
              }}
              providers={['google']}
              theme="light"
            />
          </CardContent>
        </Card>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          Small steps lead to big changes
        </p>
      </div>
    </div>
  );
};

export default Login;