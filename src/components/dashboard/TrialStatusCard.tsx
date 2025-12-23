"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Anchor, Sparkles, Calendar, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface TrialStatusCardProps {
  habitName: string;
  sessionsPerWeek: number;
  duration: number;
  unit: string;
  className?: string;
  completionsInPlateau: number; // New prop: how many times goal met in current plateau
  plateauDaysRequired: number; // New prop: how many days required for trial completion
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
  const progressToTrialCompletion = (completionsInPlateau / plateauDaysRequired) * 100;
  const isTrialComplete = completionsInPlateau >= plateauDaysRequired;

  return (
    <Card className={cn("border-2 rounded-3xl overflow-hidden", "bg-habit-blue/20 border-habit-blue-border text-habit-blue-foreground", className)}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-habit-blue-foreground rounded-xl p-2 mt-1 text-habit-blue">
            <Anchor className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-sm uppercase tracking-wider">Trial Mode Active</h4>
            <p className="text-xs font-bold opacity-80">
              Low-pressure anchoring phase.
            </p>
          </div>
        </div>

        <div className="bg-habit-blue/40 rounded-2xl p-4 border border-habit-blue-border/50 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-habit-blue-foreground" />
              <span className="text-xs font-black uppercase opacity-60">Weekly Commitment</span>
            </div>
            <span className="text-sm font-black">{sessionsPerWeek} session/week</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-habit-blue-foreground" />
              <span className="text-xs font-black uppercase opacity-60">Session Goal</span>
            </div>
            <span className="text-sm font-black">{duration} {unit}</span>
          </div>

          <div className="pt-3 border-t border-habit-blue-border/50 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-habit-blue-foreground" />
                <span className="text-xs font-black uppercase opacity-60">Trial Completion</span>
              </div>
              <span className="text-sm font-black">
                {completionsInPlateau}/{plateauDaysRequired} days
              </span>
            </div>
            <Progress value={progressToTrialCompletion} className="h-2 [&>div]:bg-habit-blue-foreground" />
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
          <Info className="w-3.5 h-3.5 text-habit-blue-foreground mt-0.5 shrink-0" />
          <p className="text-[10px] font-bold leading-tight">
            Focus on just showing up. Growth only happens after this feels "boring" and routine.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};