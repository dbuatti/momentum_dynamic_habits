"use client";
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Dumbbell, Wind, BookOpen, Music, Trophy, Settings, Menu, LogOut, BarChart, Code, Moon, Sun, Calendar, Target, Sparkles, Pill, HelpCircle, PlusCircle, BarChart3, LayoutTemplate, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSession } from '@/contexts/SessionContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useTheme } from '@/contexts/ThemeContext';
import { habitIconMap } from '@/lib/habit-utils';

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  currentPath: string;
  isCollapsed: boolean; // New prop
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, label, currentPath, isCollapsed, onClick }) => {
  const isActive = currentPath === to;
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive 
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
          : "text-sidebar-foreground",
        isCollapsed && "justify-center px-2" // Center icon when collapsed
      )}
    >
      <Icon className="h-5 w-5" />
      {!isCollapsed && label}
    </Link>
  );
};

interface SidebarContentProps {
  onLinkClick?: () => void;
  isCollapsed: boolean; // New prop
  onToggleCollapse: () => void; // New prop
  isMobile: boolean; // Added isMobile prop
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onLinkClick, isCollapsed, onToggleCollapse, isMobile }) => {
  const { session, signOut } = useSession();
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    if (onLinkClick) onLinkClick();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Filter habits based on dashboardData and initialHabits
  const visibleHabits = React.useMemo(() => {
    if (isDashboardLoading || !dashboardData?.habits) return [];
    
    // Use the habit name and key from dashboardData directly
    return dashboardData.habits
      .filter(h => h.is_visible)
      .map(h => ({
        to: `/log/${h.key}`, // Use h.key for the route
        icon: habitIconMap[h.key] || habitIconMap.custom_habit, // Fallback icon
        label: h.name, // Use h.name for the label
      }));
  }, [dashboardData?.habits, isDashboardLoading]);

  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/journey", icon: Trophy, label: "Journey" },
    { to: "/history", icon: BarChart, label: "History" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/templates", icon: LayoutTemplate, label: "Templates" },
    { to: "/create-habit", icon: PlusCircle, label: "Habit Wizard" }, // Updated label
    { to: "/settings", icon: Settings, label: "Settings" },
    { to: "/help", icon: HelpCircle, label: "Help" },
  ];

  const displayName = dashboardData?.firstName && dashboardData?.lastName 
    ? `${dashboardData.firstName} ${dashboardData.lastName}` 
    : dashboardData?.firstName || session?.user?.email;

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className={cn(
        "flex h-16 items-center border-b px-4 lg:h-[60px]",
        isCollapsed ? "justify-center px-2" : "lg:px-6"
      )}>
        <Link to="/" className="flex items-center gap-2 font-semibold" onClick={onLinkClick}>
          <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && <span className="text-lg">Adaptive Growth</span>}
        </Link>
      </div>
      <ScrollArea className="flex-1 overflow-auto py-2">
        <nav className={cn(
          "grid items-start text-sm font-medium gap-1",
          isCollapsed ? "px-2" : "px-4 lg:px-6"
        )}>
          {navItems.map((item, index) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              icon={item.icon} 
              label={item.label} 
              currentPath={location.pathname} 
              isCollapsed={isCollapsed} // Pass isCollapsed
              onClick={onLinkClick} 
            />
          ))}
        </nav>
      </ScrollArea>
      <div className={cn(
        "mt-auto p-4 border-t border-sidebar-border",
        isCollapsed && "flex flex-col items-center p-2"
      )}>
        {session?.user && (
          <div className={cn(
            "flex items-center gap-3 mb-4",
            isCollapsed && "flex-col gap-1 mb-2"
          )}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={session.user.user_metadata?.avatar_url} />
              <AvatarFallback>{displayName?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-grow min-w-0">
                <p className="font-semibold text-sm truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">Logged in</p>
              </div>
            )}
          </div>
        )}
        <div className={cn(
          "flex gap-2",
          isCollapsed && "flex-col gap-2"
        )}>
          <Button 
            variant="secondary" 
            className={cn("flex-1", isCollapsed && "w-full")} 
            onClick={handleSignOut}
          >
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && "Sign Out"}
          </Button>
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleCollapse} 
            className={cn(
              "mt-4 w-full rounded-lg",
              isCollapsed ? "h-10" : "h-8"
            )}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>
    </div>
  );
};

export const Sidebar: React.FC<{ children: React.ReactNode; isCollapsed: boolean; onToggleCollapse: () => void }> = ({ children, isCollapsed, onToggleCollapse }) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-[100] rounded-full">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-[280px] p-0 bg-sidebar-background text-sidebar-foreground border-sidebar-border">
          <SidebarContent onLinkClick={() => setOpen(false)} isCollapsed={false} onToggleCollapse={onToggleCollapse} isMobile={isMobile} />
        </SheetContent>
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </Sheet>
    );
  }

  return (
    <>
      <div className={cn(
        "hidden border-r bg-sidebar-background",
        isCollapsed ? "lg:block lg:w-16" : "lg:block lg:w-[280px]"
      )}>
        <SidebarContent isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} isMobile={isMobile} />
      </div>
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </>
  );
};