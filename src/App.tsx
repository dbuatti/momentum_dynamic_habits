import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PushupLog from "./pages/PushupLog";
import MeditationLog from "./pages/MeditationLog";
import StudyLog from "./pages/StudyLog";
import PianoLog from "./pages/PianoLog";
import HouseworkLog from "./pages/HouseworkLog";
import ProjectWorkLog from "./pages/ProjectWorkLog";
import Journey from "./pages/Journey";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Onboarding from "./pages/Onboarding";
import { SessionContextProvider, useSession } from "./contexts/SessionContext";
import Layout from "@/components/layout/Layout";
import TeethBrushingLog from "./pages/TeethBrushingLog";
import MedicationLog from "./pages/MedicationLog";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session, loading } = useSession();

  // A simple protected route component
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!session) {
      return <Navigate to="/login" replace />;
    }

    return <Layout>{children}</Layout>; // Wrap children with Layout
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/log/pushups" element={<ProtectedRoute><PushupLog /></ProtectedRoute>} />
      <Route path="/log/meditation" element={<ProtectedRoute><MeditationLog /></ProtectedRoute>} />
      {/* Changed from /log/study to /log/kinesiology */}
      <Route path="/log/kinesiology" element={<ProtectedRoute><StudyLog /></ProtectedRoute>} />
      <Route path="/log/piano" element={<ProtectedRoute><PianoLog /></ProtectedRoute>} />
      <Route path="/log/housework" element={<ProtectedRoute><HouseworkLog /></ProtectedRoute>} />
      <Route path="/log/projectwork" element={<ProtectedRoute><ProjectWorkLog /></ProtectedRoute>} />
      <Route path="/log/teeth-brushing" element={<ProtectedRoute><TeethBrushingLog /></ProtectedRoute>} />
      <Route path="/log/medication" element={<ProtectedRoute><MedicationLog /></ProtectedRoute>} />
      <Route path="/journey" element={<ProtectedRoute><Journey /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      {/* Wrap NotFound with Layout for consistent styling */}
      <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <AppRoutes />
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;