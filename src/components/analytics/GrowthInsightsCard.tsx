"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserHabitRecord } from '@/types/habit';

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
  const growthOrTrialHabits = habits.filter(h => h.habit.is_trial_mode || (!h.habit.is_fixed && !h.habit.is_trial_mode));

  return (
    <Card className="rounded-2xl shadow-sm border-0">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="font-semibold text-lg flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary" />
          Growth Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        {growthOrTrialHabits.length === 0 ? (
          <p className="text-muted-foreground">All your habits are either in Adaptive Growth or Fixed mode. Keep up the great work!</p>
        ) : (
          growthOrTrialHabits.map(summary => {
            const habit = summary.habit;
            const isTrial = habit.is_trial_mode;
            const isReadyForGrowth = isTrial && habit.completions_in_plateau >= habit.plateau_days_required;
            const daysRemaining = Math.max(0, habit.plateau_days_required - habit.completions_in_plateau);

            return (
              <div key={habit.id} className={cn(
                "p-4 rounded-xl border",
                isReadyForGrowth ? "bg-green-50/50 border-green-200" : "bg-blue-50/50 border-blue-200"
              )}>
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isReadyForGrowth ? "bg-green-500 text-white" : "bg-blue-500 text-white"
                  )}>
                    {isReadyForGrowth ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-semibold">{habit.name}</p>
                    {isReadyForGrowth ? (
                      <p className="text-sm text-green-700">Ready for Adaptive Growth!</p>
                    ) : isTrial ? (
                      <p className="text-sm text-blue-700">
                        {daysRemaining} more days of consistency to transition from Trial Mode.
                      </p>
                    ) : (
                      <p className="text-sm text-purple-700">
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