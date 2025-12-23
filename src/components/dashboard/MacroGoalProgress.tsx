"use client";

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface MacroGoalProgressProps {
  current: number;
  total: number;
  label?: string;
  className?: string;
}

export const MacroGoalProgress: React.FC<MacroGoalProgressProps> = ({ 
  current, 
  total, 
  label = "Weekly Progress",
  className 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const percentage = Math.min(100, (current / total) * 100);
  
  // Theme-aware progress bar color
  const progressColor = isDark 
    ? "[&>div]:bg-[hsl(var(--primary))]" 
    : "[&>div]:bg-[hsl(var(--primary))]";

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter opacity-50">
        <span>{label}</span>
        <span>{current}/{total} sessions</span>
      </div>
      <div className="relative h-1 w-full bg-[hsl(var(--border))] rounded-full overflow-hidden">
        <div 
          className={cn("absolute top-0 left-0 h-full transition-all duration-500 ease-out", progressColor)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};