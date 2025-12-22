"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { NavigationProgressToast } from './NavigationProgressToast';
import { useTabProgress } from '@/hooks/useTabProgress';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Activate browser tab progress update
  useTabProgress();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar>
        {children}
      </Sidebar>
      <NavigationProgressToast />
    </div>
  );
};

export default Layout;