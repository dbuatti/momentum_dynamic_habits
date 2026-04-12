"use client";
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Trophy, Settings, Menu, LogOut, BarChart, Moon, Sun, Target, PlusCircle, BarChart3, LayoutTemplate, ChevronLeft, ChevronRight, HelpCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSession } from '@/contexts/SessionContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useTheme } from '@/contexts/ThemeContext';

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  currentPath: string;
  isCollapsed: boolean;
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
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-5 w-5" />
      {!isCollapsed && label}
    </Link>
  );
};

interface SidebarContentProps {
  onLinkClick?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onLinkClick, isCollapsed, onToggleCollapse, isMobile }) => {
  const { session, signOut } = useSession();
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    if (onLinkClick) onLinkClick();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/journey", icon: Trophy, label: "Journey" },
    { to: "/history", icon: BarChart, label: "History" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/templates", icon: LayoutTemplate, label: "Templates" },
    { to: "/create-habit", icon: PlusCircle, label: "Practice Lab" },
    { to: "/settings", icon: Settings, label: "Settings" },
    { to: "/help", icon: HelpCircle, label: "Help" },
  ];

  const displayName = dashboardData?.firstName && dashboardData?.lastName
    ? `${dashboardData.firstName} ${dashboardData.lastName}`
    : dashboardData?.firstName || session?.user?.email;

  const completed = dashboardData?.dailyMomentumParts?.completed || 0;
  const total = dashboardData?.dailyMomentumParts?.total || 0;
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-sidebar-background">
      <div className={cn(
        "flex h-16 items-center border-b px-4 lg:h-[60px]",
        isCollapsed ? "justify-center px-2" : "lg:px-6"
      )}>
        <Link to="/" className="flex items-center gap-2 font-semibold" onClick={onLinkClick}>
          <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && <span className="text-lg tracking-tighter font-black uppercase italic">Adaptive</span>}
        </Link>
      </div>

      <div className="px-4 py-4">
        <Button 
          className={cn("w-full justify-start gap-2 rounded-xl h-11 font-bold shadow-sm", isCollapsed && "justify-center px-0")}
          onClick={() => {
            navigate('/create-habit');
            if (onLinkClick) onLinkClick();
          }}
        >
          <Plus className="h-5 w-5" />
          {!isCollapsed && "New Practice"}
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-auto py-2">
        <nav className={cn(
          "grid items-start text-sm font-medium gap-1",
          isCollapsed ? "px-2" : "px-4 lg:px-6"
        )}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              currentPath={location.pathname}
              isCollapsed={isCollapsed}
              onClick={onLinkClick}
            />
          ))}
        </nav>
      </ScrollArea>

      {!isCollapsed && total > 0 && (
        <div className="px-6 py-4 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <span>Daily Progress</span>
            <span>{completed}/{total}</span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className={cn(
        "mt-auto p-4 border-t border-sidebar-border",
        isCollapsed && "flex flex-col items-center p-2"
      )}>
        {session?.user && (
          <div className={cn(
            "flex items-center gap-3 mb-4",
            isCollapsed && "flex-col gap-1 mb-2"
          )}>
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <AvatarImage src={session.user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">{displayName?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-grow min-w-0">
                <p className="font-bold text-sm truncate">{displayName}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Level {dashboardData?.level || 1}</p>
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
            className={cn("flex-1 rounded-xl", isCollapsed && "w-full")}
            onClick={handleSignOut}
          >
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && "Sign Out"}
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={toggleTheme} aria-label="Toggle theme">
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

export const Sidebar: React.FC<{ isCollapsed: boolean; onToggleCollapse: () => void }> = ({ isCollapsed, onToggleCollapse }) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-[100] rounded-full bg-background/80 backdrop-blur-sm border shadow-sm">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col w-[280px] p-0 bg-sidebar-background text-sidebar-foreground border-sidebar-border">
            <SidebarContent onLinkClick={() => setOpen(false)} isCollapsed={false} onToggleCollapse={onToggleCollapse} isMobile={isMobile} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className={cn(
      "hidden border-r bg-sidebar-background transition-all duration-300",
      isCollapsed ? "lg:block lg:w-16" : "lg:block lg:w-[280px]"
    )}>
      <SidebarContent isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} isMobile={isMobile} />
    </div>
  );
};