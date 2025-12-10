import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader<dyad-problem-report summary="4 problems">
<problem file="src/App.tsx" line="59" column="62" code="1005">'...' expected.</problem>
<problem file="src/App.tsx" line="60" column="7" code="1003">Identifier expected.</problem>
<problem file="src/components/dashboard/PatternsCard.tsx" line="25" column="19" code="2304">Cannot find name 'cn'.</problem>
<problem file="src/components/dashboard/PatternsCard.tsx" line="33" column="19" code="2304">Cannot find name 'cn'.</problem>
</dyad-problem-report>I'll fix these TypeScript errors right away.

<dyad-write path="src/App.tsx" description="Fixing the route syntax error by properly closing the history route">
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