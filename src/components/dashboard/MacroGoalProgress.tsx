"use client";

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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
  const percentage = Math.min(100, (current / total) * 100);
  
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
        <span>{label}</span>
        <span>{current}/{total} sessions</span>
      </div>
      <div className="relative h-1 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};