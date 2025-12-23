"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Target, Info, CheckCircle2, Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill } from 'lucide-react';
import { UserHabitRecord } from '@/types/habit';
import { habitIconMap } from '@/lib/habit-utils'; // Import from centralized utility

interface HabitAnalyticsSummary {
  habit: UserHabitRecord;
  dailyProgress: number;
  isComplete: boolean;
  totalCompletions: number;
  totalDurationOrReps: number;
  averageDurationOrReps: number;
  completionRate: number; // Percentage of scheduled days completed
  capsuleCompletionRate: number; // Percentage of capsules completed
  missedDays: string[]; // Dates when habit was scheduled but not completed
  weeklyCompletions: { [weekStart: string]: number };
  weeklyDurationOrReps: { [weekStart: string]: number };
  weeklyCapsuleCompletions: { [weekStart: string]: number };
  weeklyCapsuleTotals: { [weekStart: string]: number };
}

interface HabitPerformanceOverviewProps {
  habits: HabitAnalyticsSummary[];
}

export const HabitPerformanceOverview: React.FC<HabitPerformanceOverviewProps> = ({ habits }) => {
  return (
    <Card className="rounded-2xl shadow-sm border-0">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="font-semibold text-lg flex items-center">
          <Target className="w-5 h-5 mr-2 text-primary" />
          Habit Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-6">
        {habits.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">No habits to display for this filter.</div>
        ) : (
          habits.map((summary) => {
            const habit = summary.habit;
            const Icon = habitIconMap[habit.habit_key] || habitIconMap.custom_habit; // Fallback icon
            const progressValue = (habit.current_daily_goal > 0) ? (summary.dailyProgress / habit.current_daily_goal) * 100 : 0;
            const isGrowth = !habit.is_fixed && !habit.is_trial_mode;
            const isTrial = habit.is_trial_mode;
            const isFixed = habit.is_fixed;

            let statusText = "";
            let statusColorClass = "";
            if (isFixed) {
              statusText = "Fixed Goal";
              statusColorClass = "bg-gray-100 text-gray-700 border-gray-200";
            } else if (isTrial) {
              statusText = `Trial: ${habit.completions_in_plateau}/${habit.plateau_days_required} days`;
              statusColorClass = "bg-blue-100 text-blue-700 border-blue-200";
            } else if (isGrowth) {
              statusText = `Growth: ${habit.completions_in_plateau}/${habit.plateau_days_required} days`;
              statusColorClass = "bg-purple-100 text-purple-700 border-purple-200";
            }

            return (
              <div key={habit.id} className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{habit.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(habit.current_daily_goal)} {habit.unit} daily • {habit.frequency_per_week}x weekly
                      </p>
                    </div>
                  </div>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", statusColorClass)}>
                    {statusText}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Daily Progress</span>
                    <span>{Math.round(summary.dailyProgress)}/{Math.round(habit.current_daily_goal)} {habit.unit}</span>
                  </div>
                  <Progress value={progressValue} className="h-2 [&>div]:bg-primary" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Lifetime Progress</span>
                  <span>{Math.round(summary.totalDurationOrReps)} {habit.unit}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Completion Rate</span>
                  <span>{summary.completionRate}%</span>
                </div>
                {habit.enable_chunks && (
                  <div className="flex justify-between text-xs text-muted-foreground">
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