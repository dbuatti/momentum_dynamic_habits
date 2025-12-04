"use client";

import React from 'react';
import { Sidebar } from './Sidebar.tsx'; // Added .tsx extension

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Sidebar>
      {children}
    </Sidebar>
  );
};

export default Layout;