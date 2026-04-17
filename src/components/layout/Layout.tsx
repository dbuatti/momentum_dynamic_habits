"use client";

import React from 'react';
import { useTabProgress } from '@/hooks/useTabProgress';
import { FloatingTimer } from './FloatingTimer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Activate browser tab progress update
  useTabProgress();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Main content area - Enabled vertical scrolling for standard pages */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <FloatingTimer />
    </div>
  );
};

export default Layout;