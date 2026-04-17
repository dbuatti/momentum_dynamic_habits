"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Info, CheckCircle2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserHabitRecord } from '@/types/habit';
import { getLevelXpStats } from '@/utils/habit-leveling';

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
            const { xpInLevel, xpNeededForNext } = getLevelXpStats(habit.habit_xp || 0);
            const xpRemaining = Math.max(0, xpNeededForNext - xpInLevel);
            const isCloseToLevelUp = xpRemaining <= 1;

            return (
              <div key={habit.id} className={cn(
                "p-4 rounded-xl border",
                isCloseToLevelUp ? "bg-success-background/50 border-success-border" : "bg-info-background/50 border-info-border"
              )}>
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isCloseToLevelUp ? "bg-success text-success-foreground" : "bg-info text-info-foreground"
                  )}>
                    {isCloseToLevelUp ? <Trophy className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-semibold">{habit.name} (Lvl {habit.habit_level || 1})</p>
                    {isCloseToLevelUp ? (
                      <p className="text-sm text-success-foreground">Almost Level { (habit.habit_level || 1) + 1 }! Just {Math.round(xpRemaining * 10) / 10} XP to go.</p>
                    ) : (
                      <p className="text-sm text-info-foreground">
                        {Math.round(xpRemaining * 10) / 10} XP until next level up.
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