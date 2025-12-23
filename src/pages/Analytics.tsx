"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, Loader2, BarChart3, Calendar, Target, Zap, TrendingUp,
  Clock, Layers, ShieldCheck, Info, Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill,
  CheckCircle2, Filter, MessageSquare // Added MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import HabitHeatmap from '@/components/dashboard/HabitHeatmap';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAnalyticsData } from '@/hooks/useAnalyticsData'; // Import the new hook
import { ReflectionCard } from '@/components/analytics/ReflectionCard'; // Import ReflectionCard
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

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
  const { data: analyticsData, isLoading, isError } = useAnalyticsData();
  const [habitFilter, setHabitFilter] = useState<string>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('8_weeks'); // Default to 8 weeks

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !analyticsData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-background">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-foreground">Could not load Analytics Data</h2>
        <p className="text-lg text-muted-foreground">There was an error fetching your progress. Please try again later.</p>
        <Link to="/"><Button variant="outline" className="mt-4">Go Home</Button></Link>
      </div>
    );
  }

  const { profile, habits, overallWeeklySummary, latestReflection, reflectionPrompt } = analyticsData;
  const { neurodivergent_mode: neurodivergentMode } = profile;

  // Filter habits based on selected filter
  const filteredHabits = habitFilter === 'all'
    ? habits
    : habits.filter(h => h.habit.habit_key === habitFilter);

  // Prepare heatmap data (currently from useHabitHeatmapData, but will be integrated into useAnalyticsData)
  // For now, let's create a dummy heatmap data from the analyticsData for all habits
  const allHabitCompletions = habits.flatMap(h => {
    const completionsMap = new Map<string, number>();
    Object.entries(h.weeklyCompletions).forEach(([weekStart, count]) => {
      // Distribute weekly completions across days for heatmap visualization
      // This is a simplification; a real heatmap needs daily data
      const start = new Date(weekStart);
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        const dateStr = format(day, 'yyyy-MM-dd');
        completionsMap.set(dateStr, (completionsMap.get(dateStr) || 0) + (count / 7)); // Average per day
      }
    });
    return Array.from(completionsMap.entries()).map(([date, count]) => ({ date, count: Math.round(count) }));
  });


  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-8 pb-32">
      <PageHeader title="Your Analytics" backLink="/" />

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={habitFilter} onValueChange={setHabitFilter}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="All Habits" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Habits</SelectItem>
              {habits.map(h => (
                <SelectItem key={h.habit.id} value={h.habit.habit_key}>
                  {h.habit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="Last 8 Weeks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4_weeks">Last 4 Weeks</SelectItem>
              <SelectItem value="8_weeks">Last 8 Weeks</SelectItem>
              <SelectItem value="12_weeks">Last 12 Weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
            <p className="text-2xl font-bold text-primary">{overallWeeklySummary.activeDays}</p>
            <p className="text-sm text-muted-foreground mt-1">Days Active</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary">{overallWeeklySummary.streak}</p>
            <p className="text-sm text-muted-foreground mt-1">Day Streak</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary">{overallWeeklySummary.consistency}%</p>
            <p className="text-sm text-muted-foreground mt-1">Consistency</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary">{overallWeeklySummary.totalCompletions}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Sessions</p>
          </div>
          {/* Best Time to Focus will come from useDashboardData or be integrated here */}
          <div className="col-span-2 bg-primary/5 rounded-xl p-4">
            <p className="text-xl font-bold text-primary flex items-center justify-center">
              <Clock className="w-5 h-5 mr-2" />
              {/* patterns.bestTime */}
              Best Time to Focus
            </p>
            <p className="text-sm text-muted-foreground mt-1">Log more tasks to discover your best time!</p>
          </div>
        </CardContent>
      </Card>

      {/* Habit Consistency Heatmap */}
      <div className="mb-6">
        <HabitHeatmap completions={allHabitCompletions} habitName="All Habits" />
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
          {filteredHabits.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">No habits to display for this filter.</div>
          ) : (
            filteredHabits.map((summary) => {
              const habit = summary.habit;
              const Icon = habitIconMap[habit.habit_key] || Target;
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
                          {habit.current_daily_goal} {habit.unit} daily • {habit.frequency_per_week}x weekly
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
                      <span>{Math.round(summary.dailyProgress)}/{habit.current_daily_goal} {habit.unit}</span>
                    </div>
                    <Progress value={progressValue} className="h-2 [&>div]:bg-primary" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Lifetime Progress</span>
                    <span>{summary.totalDurationOrReps} {habit.unit}</span>
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

      {/* Growth Insights (Trial-to-Growth Transition) */}
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="font-semibold text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            Growth Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          {habits.filter(h => h.habit.is_trial_mode || (!h.habit.is_fixed && !h.habit.is_trial_mode)).length === 0 ? (
            <p className="text-muted-foreground">All your habits are either in Adaptive Growth or Fixed mode. Keep up the great work!</p>
          ) : (
            habits.filter(h => h.habit.is_trial_mode || (!h.habit.is_fixed && !h.habit.is_trial_mode)).map(summary => {
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

      {/* Reflection Card */}
      <ReflectionCard
        prompt={reflectionPrompt}
        initialNotes={latestReflection?.notes || null}
        lastReflectionDate={latestReflection?.reflection_date || null}
        xpBonusAwarded={latestReflection?.xp_bonus_awarded || false}
      />
    </div>
  );
};

export default Analytics;