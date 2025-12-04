"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Dumbbell, Wind, BookOpen, Music, Trophy, Settings, Menu, LogOut, BarChart } from 'lucide-react'; // Added BarChart for History
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSession } from '@/contexts/SessionContext';
import { useDashboardData } from '@/hooks/useDashboardData'; // To get first name

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
    <Link to={to} onClick={onClick} className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground"
    )}>
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
  const { data: dashboardData } = useDashboardData();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    if (onLinkClick) onLinkClick();
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/journey", icon: Trophy, label: "Journey" },
    { to: "/history", icon: BarChart, label: "History" }, // Added History link
    { to: "/log/pushups", icon: Dumbbell, label: "Push-ups" },
    { to: "/log/meditation", icon: Wind, label: "Meditation" },
    { to: "/log/kinesiology", icon: BookOpen, label: "Study" },
    { to: "/log/piano", icon: Music, label: "Piano" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold" onClick={onLinkClick}>
          <span className="text-lg">Adaptive Growth</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium lg:px-6 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              currentPath={location.pathname}
              onClick={onLinkClick}
            />
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 border-t">
        {session?.user && (
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarImage src={session.user.user_metadata?.avatar_url} />
              <AvatarFallback>{dashboardData?.firstName?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-semibold text-sm">{dashboardData?.firstName || session.user.email}</p>
              <p className="text-xs text-muted-foreground">Logged in</p>
            </div>
          </div>
        )}
        <Button variant="secondary" className="w-full" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 z-20">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col w-[280px] sm:w-[320px] p-0">
              <SidebarContent onLinkClick={handleLinkClick} />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1 text-center">
            <h1 className="text-lg font-semibold">Adaptive Growth</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-sidebar md:block">
        <SidebarContent />
      </div>
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};