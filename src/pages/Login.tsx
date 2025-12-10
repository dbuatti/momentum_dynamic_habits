import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect } from 'react';
import { Loader2, Target } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const Login = () => {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      console.log('Login useEffect - Session found, navigating to /');
      // After login, check if onboarding is needed
      navigate('/onboarding', { replace: true });
      if (window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [session, loading, navigate]);

  const redirectToUrl = window.location.origin;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background py-12 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Adaptive Growth Coach
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Build better habits with personalized guidance
          </p>
        </div>
        
        <Card className="p-8 rounded-2xl shadow-lg">
          <CardHeader className="p-0 mb-6">
            <h3 className="text-xl font-semibold text-center">Sign in to your account</h3>
          </CardHeader>
          <CardContent className="p-0">
            <Auth 
              supabaseClient={supabase} 
              appearance={{ 
                theme: ThemeSupa,
                style: {
                  button: {
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                  },
                  input: {
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                  }
                }
              }} 
              providers={['google']}
              theme="light"
              redirectTo={redirectToUrl}
            />
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;