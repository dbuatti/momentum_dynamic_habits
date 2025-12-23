import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Journey from "./pages/Journey";
import History from "./pages/History";
import OnboardingFlow from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import HelpPage from "./pages/HelpPage";
import LandingPage from "./pages/LandingPage";
import CreateHabit from "./pages/CreateHabit";
import Analytics from "./pages/Analytics";
import TemplatesPage from "./pages/TemplatesPage"; // Import TemplatesPage
import { SessionContextProvider, useSession } from "./contexts/SessionContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useOnboardingCheck } from "./hooks/useOnboardingCheck";
import { DashboardSkeleton } from "./components/dashboard/DashboardSkeleton";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: isSessionLoading } = useSession();
  const { isOnboarded, isLoading: isOnboardingCheckLoading } = useOnboardingCheck();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  useEffect(() => {
    if (!isOnboardingCheckLoading) {
      setHasCheckedOnboarding(true);
    }
  }, [isOnboardingCheckLoading]);

  if (isSessionLoading || !hasCheckedOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/landing" replace />;
  }

  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Layout>{children}</Layout>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: isSessionLoading } = useSession();
  const { isOnboarded, isLoading: isOnboardingCheckLoading } = useOnboardingCheck();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  useEffect(() => {
    if (!isOnboardingCheckLoading) {
      setHasCheckedOnboarding(true);
    }
  }, [isOnboardingCheckLoading]);

  if (isSessionLoading || !hasCheckedOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (isOnboarded) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const LoginRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: isSessionLoading } = useSession();
  const { isOnboarded, isLoading: isOnboardingCheckLoading } = useOnboardingCheck();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  useEffect(() => {
    if (!isOnboardingCheckLoading) {
      setHasCheckedOnboarding(true);
    }
  }, [isOnboardingCheckLoading]);

  if (isSessionLoading || !hasCheckedOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session && isOnboarded) {
    return <Navigate to="/" replace />;
  }

  if (session && !isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};


const AppRoutes = () => {
  const { refetch: refetchOnboardingStatus } = useOnboardingCheck();

  const handleOnboardingComplete = async () => {
    await refetchOnboardingStatus();
  };

  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginRoute><Login /></LoginRoute>} />
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingFlow onComplete={handleOnboardingComplete} />
          </OnboardingRoute>
        }
      />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      {/* Removed /log/:habitKey route */}
      <Route path="/journey" element={<ProtectedRoute><Journey /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
      <Route path="/create-habit" element={<ProtectedRoute><CreateHabit /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} /> {/* New Templates Page Route */}
      <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <SonnerToaster />
      <BrowserRouter>
        <SessionContextProvider>
          <ThemeProvider>
            <AppRoutes />
          </ThemeProvider>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;