"use client";
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Dumbbell, Wind, BookOpen, Music, Trophy, Settings, Menu, LogOut, BarChart, Code, Moon, Sun, Calendar, Target, Sparkles, Pill, HelpCircle, PlusCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSession } from '@/contexts/SessionContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useTheme } from '@/contexts/ThemeContext';
import { habitIconMap } from '@/lib/habit-utils'; // Import from centralized utility

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  currentPath: string;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, label, currentPath, onClick }) => {
  const isActive = currentPath === to;
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive 
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
          : "text-sidebar-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
};

interface SidebarContentProps {
  onLinkClick?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onLinkClick }) => {
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
    { to: "/analytics", icon: BarChart3, label: "Analytics" }, // New Analytics link
    {
      label: "Habits (Analytics)", // Changed label
      items: [
        ...visibleHabits,
        { to: "/create-habit", icon: PlusCircle, label: "Create New Habit" },
      ],
    },
    { to: "/settings", icon: Settings, label: "Settings" },
    { to: "/help", icon: HelpCircle, label: "Help" },
  ];

  const displayName = dashboardData?.firstName && dashboardData?.lastName 
    ? `${dashboardData.firstName} ${dashboardData.lastName}` 
    : dashboardData?.firstName || session?.user?.email;

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-16 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold" onClick={onLinkClick}>
          <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg">Adaptive Growth</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium lg:px-6 gap-1">
          {navItems.map((section, index) => (
            <div key={index}>
              {section.items ? (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">
                    {section.label}
                  </div>
                  {section.items.map((item) => (
                    <NavLink 
                      key={item.to} 
                      to={item.to} 
                      icon={item.icon} 
                      label={item.label} 
                      currentPath={location.pathname} 
                      onClick={onLinkClick} 
                    />
                  ))}
                </>
              ) : (
                <NavLink 
                  key={section.to} 
                  to={section.to} 
                  icon={section.icon} 
                  label={section.label} 
                  currentPath={location.pathname} 
                  onClick={onLinkClick} 
                />
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 border-t">
        {session?.user && (
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session.user.user_metadata?.avatar_url} />
              <AvatarFallback>{displayName?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-grow min-w-0">
              <p className="font-semibold text-sm truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">Logged in</p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
          <SidebarContent onLinkClick={() => setOpen(false)} />
        </SheetContent>
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </Sheet>
    );
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-sidebar-background lg:block">
        <SidebarContent />
      </div>
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};