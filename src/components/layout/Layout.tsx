"use client";

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { NavigationProgressToast } from './NavigationProgressToast';
import { useTabProgress } from '@/hooks/useTabProgress';
import { FloatingTimer } from './FloatingTimer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Activate browser tab progress update
  useTabProgress();
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={cn(
      "min-h-screen bg-background",
      !isMobile && "grid",
      isSidebarCollapsed ? "lg:grid-cols-[64px_1fr]" : "lg:grid-cols-[280px_1fr]"
    )}>
      {/* Render Sidebar component */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
      <NavigationProgressToast />
      <FloatingTimer />
    </div>
  );
};

export default Layout;