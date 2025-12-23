"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, Loader2, BarChart3, Calendar, Target, Zap, TrendingUp,
  Clock, Layers, ShieldCheck, Info, Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill,
  CheckCircle2 // Added here
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useDashboardData } from '@/hooks/useDashboardData';
import HabitHeatmap from '@/components/dashboard/HabitHeatmap';
import { useHabitHeatmapData } from '@/hooks/useHabitHeatmapData';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Icon map for habits, consistent with other parts of the app
const habitIconMap: Record<string, React.ElementType> = {
  pushups: Dumbbell,
  meditation: Wind,
  kinesiology: BookOpen,
  piano: Music,
  housework: Home,
  projectwork: Code,
  teeth_brushing: Sparkles,
  medication: Pill,
  study_generic: BookOpen,
  exercise_generic: Dumbbell,
  mindfulness_generic: Wind,
  creative_practice_generic: Music,
  daily_task_generic: Home,
  fixed_medication: Pill,
  fixed_teeth_brushing: Sparkles,
  custom_habit: Target,
};

const Analytics = () => {
  const { data: dashboardData, isLoading: isDashboardLoading, isError: isDashboardError } = useDashboardData();
  const { data: heatmapData, isLoading: isHeatmapLoading, isError: isHeatmapError } = useHabitHeatmapData();

  if (isDashboardLoading || isHeatmapLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isDashboardError || isHeatmapError || !dashboardData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-background">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-foreground">Could not load Analytics Data</h2>
        <p className="text-lg text-muted-foreground">There was an error fetching your progress. Please try again later.</p>
        <Link to="/"><Button variant="outline" className="mt-4">Go Home</Button></Link>
      </div>
    );
  }

  const { daysActive, patterns, xp, level, habits, neurodivergentMode } = dashboardData;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-8 pb-32">
      <PageHeader title="Your Analytics" backLink="/" />

      {/* Overall Summary */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="font-semibold text-lg flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 grid grid-cols-2 gap-4 text-center">
          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary">{daysActive}</p>
            <p className="text-sm text-muted-foreground mt-1">Days Active</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary">{patterns.streak}</p>
            <p className="text-sm text-muted-foreground mt-1">Day Streak</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary">{patterns.consistency}%</p>
            <p className="text-sm text-muted-foreground mt-1">Consistency</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary">{patterns.totalSessions}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Sessions</p>
          </div>
          <div className="col-span-2 bg-primary/5 rounded-xl p-4">
            <p className="text-xl font-bold text-primary flex items-center justify-center">
              <Clock className="w-5 h-5 mr-2" />
              {patterns.bestTime}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Best Time to Focus</p>
          </div>
        </CardContent>
      </Card>

      {/* Habit Consistency Heatmap */}
      <div className="mb-6">
        <HabitHeatmap completions={heatmapData || []} habitName="All Habits" />
      </div>

      {/* Habit Performance Overview */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="font-semibold text-lg flex items-center">
            <Target className="w-5 h-5 mr-2 text-primary" />
            Habit Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-6">
          {habits.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">No habits to display.</div>
          ) : (
            habits.map((habit) => {
              const Icon = habitIconMap[habit.key] || Target;
              const progressValue = (habit.dailyProgress / habit.dailyGoal) * 100;
              const isGrowth = !habit.is_fixed && !habit.is_trial_mode;
              const isTrial = habit.is_trial_mode;
              const isFixed = habit.is_fixed;

              let statusText = "";
              let statusColorClass = "";
              if (isFixed) {
                statusText = "Fixed Goal";
                statusColorClass = "bg-gray-100 text-gray-700 border-gray-200";
              } else if (isTrial) {
                statusText = `Trial: ${habit.growth_stats.completions}/${habit.growth_stats.required} days`;
                statusColorClass = "bg-blue-100 text-blue-700 border-blue-200";
              } else if (isGrowth) {
                statusText = `Growth: ${habit.growth_stats.completions}/${habit.growth_stats.required} days`;
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
                          {habit.dailyGoal} {habit.unit} daily • {habit.frequency_per_week}x weekly
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
                      <span>{Math.round(habit.dailyProgress)}/{habit.dailyGoal} {habit.unit}</span>
                    </div>
                    <Progress value={progressValue} className="h-2 [&>div]:bg-primary" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Lifetime Progress</span>
                    <span>{habit.lifetimeProgress} {habit.unit}</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Growth Insights (Trial-to-Growth Transition) */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="font-semibold text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            Growth Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          {habits.filter(h => h.is_trial_mode).length === 0 && habits.filter(h => !h.is_fixed).length === 0 ? (
            <p className="text-muted-foreground">All your habits are either in Adaptive Growth or Fixed mode. Keep up the great work!</p>
          ) : (
            habits.filter(h => h.is_trial_mode || (!h.is_fixed && !h.is_trial_mode)).map(habit => {
              const isTrial = habit.is_trial_mode;
              const isReadyForGrowth = isTrial && habit.growth_stats.completions >= habit.growth_stats.required;
              const daysRemaining = Math.max(0, habit.growth_stats.required - habit.growth_stats.completions);

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
    </div>
  );
};

export default Analytics;