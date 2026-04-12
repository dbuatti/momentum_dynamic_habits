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
    <div className="min-h-screen bg-background">
      {/* Main content area - No Sidebar */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
      <FloatingTimer />
    </div>
  );
};

export default Layout;