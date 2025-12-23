import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"; // Import useNavigate
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster"; // shadcn/ui toaster
import { Toaster as SonnerToaster } from "sonner"; // sonner toaster
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import LogHabit from "./pages/LogHabit"; // New dynamic habit log component
import Journey from "./pages/Journey";
import History from "./pages/History";
import Onboarding from "./pages/Onboarding"; // FIX: Changed to default import
import NotFound from "./pages/NotFound"; // Import NotFound
import HelpPage from "./pages/HelpPage"; // Import HelpPage
import { SessionContextProvider, useSession } from "./contexts/SessionContext";
import { ThemeProvider } from "./contexts/ThemeContext"; // Moved from main.tsx
import React, { useEffect, useState } from "react"; // Import React
import Layout from "@/components/layout/Layout"; // Import Layout
import { useOnboardingCheck } from "./hooks/useOnboardingCheck";
import { DashboardSkeleton } from "./components/dashboard/DashboardSkeleton"; // For loading states

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => { // FIX: Changed JSX.Element to React.ReactNode
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

  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Layout>{children}</Layout>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => { // FIX: Changed JSX.Element to React.ReactNode
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

const AppRoutes = () => {
  const { refetch: refetchOnboardingStatus } = useOnboardingCheck(); // Only need refetch here

  const handleOnboardingComplete = async () => { // Made async
    await refetchOnboardingStatus(); // Await the refetch
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/onboarding" 
        element={
          <OnboardingRoute>
            <Onboarding onComplete={handleOnboardingComplete} /> {/* FIX: Used default imported component */}
          </OnboardingRoute>
        } 
      />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/log/:habitKey" element={<ProtectedRoute><LogHabit /></ProtectedRoute>} /> {/* Dynamic habit log route */}
      <Route path="/journey" element={<ProtectedRoute><Journey /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} /> {/* New HelpPage route */}
      <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster /> {/* shadcn/ui toaster */}
      <SonnerToaster /> {/* sonner toaster */}
      <BrowserRouter>
        <SessionContextProvider>
          <ThemeProvider> {/* ThemeProvider moved here */}
            <AppRoutes />
          </ThemeProvider>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;