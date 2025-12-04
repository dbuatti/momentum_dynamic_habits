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
import Journey from "./pages/Journey";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import History from "./pages/History"; // Import the new History page
import { SessionContextProvider, useSession } from "./contexts/SessionContext";
import Layout from "@/components/layout/Layout";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session, loading } = useSession();

  // A simple protected route component
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (loading) {
      return null; // Or a loading spinner
    }
    if (!session) {
      return <Navigate to="/login" replace />;
    }
    return <Layout>{children}</Layout>; // Wrap children with Layout
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={<ProtectedRoute><Index /></ProtectedRoute>}
      />
      <Route
        path="/log/pushups"
        element={<ProtectedRoute><PushupLog /></ProtectedRoute>}
      />
      <Route
        path="/log/meditation"
        element={<ProtectedRoute><MeditationLog /></ProtectedRoute>}
      />
      <Route
        path="/log/study"
        element={<ProtectedRoute><StudyLog /></ProtectedRoute>}
      />
      <Route
        path="/log/piano"
        element={<ProtectedRoute><PianoLog /></ProtectedRoute>}
      />
      <Route
        path="/journey"
        element={<ProtectedRoute><Journey /></ProtectedRoute>}
      />
      <Route
        path="/settings"
        element={<ProtectedRoute><Settings /></ProtectedRoute>}
      />
      <Route
        path="/history" // Add the new history route
        element={<ProtectedRoute><History /></ProtectedRoute>}
      />
      {/* Wrap NotFound with Layout for consistent styling */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
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