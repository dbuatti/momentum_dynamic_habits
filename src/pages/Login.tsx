import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useSession } from '@/contexts/SessionContext';
import { useEffect } from 'react'; // Import useEffect

const Login = () => {
  const { session, loading } = useSession();
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    // If not loading and a session exists, navigate to the home page
    if (!loading && session) {
      console.log('Login useEffect - Session found, navigating to /');
      navigate('/');
      // Clean up the URL hash after successful login
      if (window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [session, loading, navigate]); // Depend on session, loading, and navigate

  const redirectToUrl = window.location.origin;

  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Adaptive Growth Coach
          </h2>
        </div>
        <div className="p-8 rounded-lg shadow-lg bg-white">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            theme="light"
            redirectTo={redirectToUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;