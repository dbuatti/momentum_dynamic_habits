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
    <Card className={cn("border-2 border-blue-200 bg-blue-50/50 rounded-3xl overflow-hidden", className)}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 rounded-xl p-2 mt-1">
            <Anchor className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-sm uppercase tracking-wider text-blue-900">Trial Mode Active</h4>
            <p className="text-xs font-bold text-blue-800 opacity-80">
              Low-pressure anchoring phase.
            </p>
          </div>
        </div>

        <div className="bg-white/60 rounded-2xl p-4 border border-blue-100 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-black uppercase opacity-60">Weekly Commitment</span>
            </div>
            <span className="text-sm font-black text-blue-900">{sessionsPerWeek} session/week</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-black uppercase opacity-60">Session Goal</span>
            </div>
            <span className="text-sm font-black text-blue-900">{duration} {unit}</span>
          </div>

          <div className="pt-3 border-t border-blue-100 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black uppercase opacity-60">Trial Completion</span>
              </div>
              <span className="text-sm font-black text-blue-900">
                {completionsInPlateau}/{plateauDaysRequired} days
              </span>
            </div>
            <Progress value={progressToTrialCompletion} className="h-2 [&>div]:bg-blue-500" />
            {isTrialComplete ? (
              <p className="text-[10px] font-bold text-blue-800 leading-tight mt-2">
                Trial complete! You're ready for Adaptive Growth.
              </p>
            ) : (
              <p className="text-[10px] font-bold text-blue-800 leading-tight mt-2">
                Complete {plateauDaysRequired - completionsInPlateau} more days to transition to Adaptive Growth.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 px-1">
          <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-[10px] font-bold text-blue-800 leading-tight">
            Focus on just showing up. Growth only happens after this feels "boring" and routine.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};