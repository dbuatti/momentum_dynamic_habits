"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Anchor, Sparkles, Calendar, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '@/contexts/ThemeContext';

interface TrialStatusCardProps {
  habitName: string;
  sessionsPerWeek: number;
  duration: number;
  unit: string;
  className?: string;
  completionsInPlateau: number;
  plateauDaysRequired: number;
}

export const TrialStatusCard: React.FC<TrialStatusCardProps> = ({ 
  habitName, 
  sessionsPerWeek, 
  duration, 
  unit,
  className,
  completionsInPlateau,
  plateauDaysRequired
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const progressToTrialCompletion = (completionsInPlateau / plateauDaysRequired) * 100;
  const isTrialComplete = completionsInPlateau >= plateauDaysRequired;

  // Use theme tokens for colors
  const cardClasses = cn(
    "border-2 rounded-3xl overflow-hidden",
    "bg-[hsl(var(--habit-blue))]/20 border-[hsl(var(--habit-blue-border))] text-[hsl(var(--habit-blue-foreground))]",
    className
  );

  const iconBgClasses = "bg-[hsl(var(--habit-blue-foreground))] rounded-xl p-2 mt-1 text-[hsl(var(--habit-blue))]";
  const sectionBgClasses = "bg-[hsl(var(--habit-blue))]/40 rounded-2xl p-4 border border-[hsl(var(--habit-blue-border))]/50";
  const progressClasses = "h-2 [&>div]:bg-[hsl(var(--habit-blue-foreground))]";

  return (
    <Card className={cardClasses}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className={iconBgClasses}>
            <Anchor className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-sm uppercase tracking-wider">Trial Mode Active</h4>
            <p className="text-xs font-bold opacity-80">
              Low-pressure anchoring phase.
            </p>
          </div>
        </div>

        <div className={sectionBgClasses}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-black uppercase opacity-60">Weekly Commitment</span>
            </div>
            <span className="text-sm font-black">{sessionsPerWeek} session/week</span>
          </div>
          
          <div className="flex justify-between items-center pt-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-black uppercase opacity-60">Session Goal</span>
            </div>
            <span className="text-sm font-black">{duration} {unit}</span>
          </div>

          <div className="pt-3 border-t border-[hsl(var(--habit-blue-border))]/50 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-black uppercase opacity-60">Trial Completion</span>
              </div>
              <span className="text-sm font-black">
                {completionsInPlateau}/{plateauDaysRequired} days
              </span>
            </div>
            <Progress value={progressToTrialCompletion} className={progressClasses} />
            {isTrialComplete ? (
              <p className="text-[10px] font-bold leading-tight mt-2">
                Trial complete! You're ready for Adaptive Growth.
              </p>
            ) : (
              <p className="text-[10px] font-bold leading-tight mt-2">
                Complete {plateauDaysRequired - completionsInPlateau} more days to transition to Adaptive Growth.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 px-1">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p className="text-[10px] font-bold leading-tight">
            Focus on just showing up. Growth only happens after this feels "boring" and routine.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};