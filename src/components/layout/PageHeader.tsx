"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  backLink?: string;
  showHomeLink?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  backLink,
  showHomeLink = false
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2">
        {backLink ? (
          <Link to={backLink}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-[hsl(var(--muted))]/50">
              <ArrowLeft className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            </Button>
          </Link>
        ) : (
          <div className="w-10"></div>
        )}
        
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">{title}</h1>
      </div>
      
      {showHomeLink ? (
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-[hsl(var(--muted))]/50">
            <Home className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          </Button>
        </Link>
      ) : (
        <div className="w-10"></div>
      )}
    </div>
  );
};