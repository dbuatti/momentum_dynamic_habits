"use client";

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, Loader2, BarChart3, Calendar, Target, Zap, TrendingUp,
  Clock, Layers, ShieldCheck, Info, Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill,
  CheckCircle2, Filter, MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import HabitHeatmap from '@/components/dashboard/HabitHeatmap';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { ReflectionCard } from '@/components/analytics/ReflectionCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { HabitPerformanceOverview } from '@/components/analytics/HabitPerformanceOverview';
import { GrowthInsightsCard } from '@/components/analytics/GrowthInsightsCard';
import { useDashboardData } from '@/hooks/useDashboardData';

const Analytics = () => {
  const [timeframeFilter, setTimeframeFilter] = useState<string>('8_weeks'); // Default to 8 weeks
  const { data: analyticsData, isLoading, isError } = useAnalyticsData(timeframeFilter); // Pass timeframeFilter
  const { data: dashboardData, isLoading: isDashboardDataLoading } = useDashboardData();
  const [habitFilter, setHabitFilter] = useState<string>('all');
  

  // Filter habits based on selection
  const filteredHabits = useMemo(() => {
    if (!analyticsData?.habits) return [];
    return habitFilter === 'all'
      ? analyticsData.habits
      : analyticsData.habits.filter(h => h.habit.habit_key === habitFilter);
  }, [habitFilter, analyticsData]);

  // Generate heatmap data based on the current filter
  const habitCompletions = useMemo(() => {
    if (!filteredHabits.length) return [];
    
    const completionsMap = new Map<string, number>();
    
    filteredHabits.forEach(h => {
      Object.entries(h.weeklyCompletions).forEach(([weekStart, count]) => {
        const start = new Date(weekStart);
        for (let i = 0; i < 7; i++) {
          const day = new Date(start);
          day.setDate(start.getDate() + i);
          const dateStr = format(day, 'yyyy-MM-dd');
          // Add normalized daily counts
          const current = completionsMap.get(dateStr) || 0;
          completionsMap.set(dateStr, current + (Number(count) / 7));
        }
      });
    });

    return Array.from(completionsMap.entries()).map(([date, count]) => ({
      date,
      count: Math.round(count)
    }));
  }, [filteredHabits]);

  if (isLoading || isDashboardDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !analyticsData || !dashboardData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-background">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-black text-foreground mb-2">Sync Error</h2>
        <p className="text-lg text-muted-foreground font-medium">We couldn't retrieve your growth data.</p>
        <Link to="/"><Button variant="outline" className="mt-6 rounded-xl">Return to Dashboard</Button></Link>
      </div>
    );
  }

  const { overallWeeklySummary, latestReflection, reflectionPrompt } = analyticsData;
  const { patterns } = dashboardData;

  return (
    // Updated width to max-w-2xl for better desktop visibility
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-10 pb-32">
      <PageHeader title="Growth Analytics" backLink="/" />

      {/* Filter Toolbar */}
      <section className="bg-secondary p-2 rounded-2xl border border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 pl-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filter By</span>
        </div>
        <div className="flex items-center gap-3">
          <Select value={habitFilter} onValueChange={setHabitFilter}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl bg-card border-border font-bold text-xs">
              <SelectValue placeholder="All Habits" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="all">All Practices</SelectItem>
              {analyticsData.habits.map(h => (
                <SelectItem key={h.habit.habit_key} value={h.habit.habit_key}> {/* Fixed: Use habit_key */}
                  {h.habit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl bg-card border-border font-bold text-xs">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="4_weeks">Last 4 Weeks</SelectItem>
              <SelectItem value="8_weeks">Last 8 Weeks</SelectItem>
              <SelectItem value="12_weeks">Last 12 Weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* High-Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Days Active', val: overallWeeklySummary.activeDays, icon: Calendar, color: 'text-info' },
          { label: 'Current Streak', val: overallWeeklySummary.streak, icon: Zap, color: 'text-warning' },
          { label: 'Consistency', val: `${overallWeeklySummary.consistency}%`, icon: TrendingUp, color: 'text-success' }
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-xl shadow-background/50 rounded-3xl">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-secondary", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-foreground tabular-nums">{stat.val}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Focus Pattern Card */}
      <Card className="border-0 shadow-xl shadow-background/50 rounded-[2rem] bg-primary text-primary-foreground overflow-hidden">
        <CardContent className="p-8 flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-info">Peak Performance Window</p>
            <h3 className="text-2xl font-black italic uppercase tracking-tight">
              {patterns.bestTime !== '—' ? patterns.bestTime : 'Calculating...'}
            </h3>
            <p className="text-xs font-medium text-primary-foreground/70">This is when your brain is most primed for deep work.</p>
          </div>
          <div className="bg-primary-foreground/10 p-4 rounded-3xl backdrop-blur-md">
            <Clock className="w-8 h-8 text-primary-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Consistency Visualization */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Momentum Heatmap</h2>
        </div>
        <Card className="border-0 shadow-xl shadow-background/50 rounded-[2rem] p-6">
          <HabitHeatmap 
            completions={habitCompletions} 
            habitName={habitFilter === 'all' ? 'Overall Consistency' : 'Practice Consistency'} 
            timeframe={timeframeFilter} // Pass timeframe to HabitHeatmap
          />
        </Card>
      </div>

      {/* Performance Grid */}
      <div className="space-y-6">
        <HabitPerformanceOverview habits={filteredHabits} />
        <GrowthInsightsCard habits={analyticsData.habits} />
      </div>

      {/* Reflection & Bonus */}
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