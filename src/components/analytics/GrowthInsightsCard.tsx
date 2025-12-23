"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserHabitRecord } from '@/types/habit';
import { useTheme } from '@/contexts/ThemeContext';

interface HabitAnalyticsSummary {
  habit: UserHabitRecord;
  dailyProgress: number;
  isComplete: boolean;
  totalCompletions: number;
  totalDurationOrReps: number;
  averageDurationOrReps: number;
  completionRate: number;
  capsuleCompletionRate: number;
  missedDays: string[];
  weeklyCompletions: { [weekStart: string]: number };
  weeklyDurationOrReps: { [weekStart: string]: number };
  weeklyCapsuleCompletions: { [weekStart: string]: number };
  weeklyCapsuleTotals: { [weekStart: string]: number };
}

interface GrowthInsightsCardProps {
  habits: HabitAnalyticsSummary[];
}

export const GrowthInsightsCard: React.FC<GrowthInsightsCardProps> = ({ habits }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const growthOrTrialHabits = habits.filter(h => h.habit.is_trial_mode || (!h.habit.is_fixed && !h.habit.is_trial_mode));

  return (
    <Card className="rounded-2xl shadow-sm border-0">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="font-semibold text-lg flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-[hsl(var(--primary))]" />
          Growth Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        {growthOrTrialHabits.length === 0 ? (
          <p className="text-[hsl(var(--muted-foreground))]">All your habits are either in Adaptive Growth or Fixed mode. Keep up the great work!</p>
        ) : (
          growthOrTrialHabits.map(summary => {
            const habit = summary.habit;
            const isTrial = habit.is_trial_mode;
            const isReadyForGrowth = isTrial && habit.completions_in_plateau >= habit.plateau_days_required;
            const daysRemaining = Math.max(0, habit.plateau_days_required - habit.completions_in_plateau);

            // Theme-aware colors
            const containerBg = isReadyForGrowth 
              ? "bg-[hsl(var(--habit-green))]/50 border-[hsl(var(--habit-green-border))]" 
              : "bg-[hsl(var(--habit-blue))]/50 border-[hsl(var(--habit-blue-border))]";
            const iconBg = isReadyForGrowth 
              ? "bg-[hsl(var(--habit-green-foreground))]" 
              : "bg-[hsl(var(--habit-blue-foreground))]";
            const iconText = isReadyForGrowth 
              ? "text-[hsl(var(--habit-green))]" 
              : "text-[hsl(var(--habit-blue))]";
            const textColor = isReadyForGrowth 
              ? "text-[hsl(var(--habit-green-foreground))]" 
              : "text-[hsl(var(--habit-blue-foreground))]";

            return (
              <div key={habit.id} className={cn("p-4 rounded-xl border", containerBg)}>
                <div className="flex items-center space-x-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", iconBg, iconText)}>
                    {isReadyForGrowth ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-semibold">{habit.name}</p>
                    {isReadyForGrowth ? (
                      <p className={cn("text-sm", textColor)}>Ready for Adaptive Growth!</p>
                    ) : isTrial ? (
                      <p className={cn("text-sm", textColor)}>
                        {daysRemaining} more days of consistency to transition from Trial Mode.
                      </p>
                    ) : (
                      <p className={cn("text-sm", textColor)}>
                        Adaptive Growth: {daysRemaining} consistent days until next goal increase.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};