"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';
import { UserHabitRecord } from '@/types/habit';
import { habitIconMap } from '@/lib/habit-utils';
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

interface HabitPerformanceOverviewProps {
  habits: HabitAnalyticsSummary[];
}

export const HabitPerformanceOverview: React.FC<HabitPerformanceOverviewProps> = ({ habits }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Card className="rounded-2xl shadow-sm border-0">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="font-semibold text-lg flex items-center">
          <Target className="w-5 h-5 mr-2 text-[hsl(var(--primary))]" />
          Habit Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-6">
        {habits.length === 0 ? (
          <div className="text-center text-[hsl(var(--muted-foreground))] py-4">No habits to display for this filter.</div>
        ) : (
          habits.map((summary) => {
            const habit = summary.habit;
            const Icon = habitIconMap[habit.habit_key] || habitIconMap.custom_habit;
            const progressValue = (habit.current_daily_goal > 0) ? (summary.dailyProgress / habit.current_daily_goal) * 100 : 0;
            const isGrowth = !habit.is_fixed && !habit.is_trial_mode;
            const isTrial = habit.is_trial_mode;
            const isFixed = habit.is_fixed;

            let statusText = "";
            let statusColorClass = "";
            if (isFixed) {
              statusText = "Fixed Goal";
              statusColorClass = isDark ? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]";
            } else if (isTrial) {
              statusText = `Trial: ${habit.completions_in_plateau}/${habit.plateau_days_required} days`;
              statusColorClass = "bg-[hsl(var(--habit-blue))] text-[hsl(var(--habit-blue-foreground))] border-[hsl(var(--habit-blue-border))]";
            } else if (isGrowth) {
              statusText = `Growth: ${habit.completions_in_plateau}/${habit.plateau_days_required} days`;
              statusColorClass = "bg-[hsl(var(--habit-purple))] text-[hsl(var(--habit-purple-foreground))] border-[hsl(var(--habit-purple-border))]";
            }

            return (
              <div key={habit.id} className={cn("p-4 rounded-xl border", isDark ? "bg-[hsl(var(--muted))]/30" : "bg-[hsl(var(--muted))]/30", "border-[hsl(var(--border))] space-y-3")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--background))] flex items-center justify-center border border-[hsl(var(--border))]">
                      <Icon className="w-5 h-5 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                      <p className="font-semibold">{habit.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {Math.round(habit.current_daily_goal)} {habit.unit} daily • {habit.frequency_per_week}x weekly
                      </p>
                    </div>
                  </div>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", statusColorClass)}>
                    {statusText}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span>Daily Progress</span>
                    <span>{Math.round(summary.dailyProgress)}/{Math.round(habit.current_daily_goal)} {habit.unit}</span>
                  </div>
                  <Progress value={progressValue} className="h-2 [&>div]:bg-[hsl(var(--primary))]" />
                </div>
                <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span>Lifetime Progress</span>
                  <span>{Math.round(summary.totalDurationOrReps)} {habit.unit}</span>
                </div>
                <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span>Completion Rate</span>
                  <span>{summary.completionRate}%</span>
                </div>
                {habit.enable_chunks && (
                  <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span>Capsule Completion Rate</span>
                    <span>{summary.capsuleCompletionRate}%</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};