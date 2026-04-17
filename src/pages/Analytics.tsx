"use client";

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, Loader2, Calendar, Zap, TrendingUp,
  Clock, Layers, Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import HabitHeatmap from '@/components/dashboard/HabitHeatmap';
import { cn } from '@/lib/utils';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useDashboardData } from '@/hooks/useDashboardData';
import { HabitLevelBars } from '@/components/analytics/HabitLevelBars';

const Analytics = () => {
  const [timeframeFilter, setTimeframeFilter] = useState<string>('8_weeks');
  const { data: analyticsData, isLoading, isError } = useAnalyticsData(timeframeFilter);
  const { data: dashboardData, isLoading: isDashboardDataLoading } = useDashboardData();
  const [taskFilter, setTaskFilter] = useState<string>('all');

  const filteredTasks = useMemo(() => {
    if (!analyticsData?.tasks) return [];
    return taskFilter === 'all'
      ? analyticsData.tasks
      : analyticsData.tasks.filter(t => t.task.id === taskFilter);
  }, [taskFilter, analyticsData]);

  const taskCompletions = useMemo(() => {
    if (!filteredTasks.length) return [];
    const completionsMap = new Map<string, number>();
    filteredTasks.forEach(t => {
      Object.entries(t.weeklyCompletions).forEach(([weekStart, count]) => {
        const start = new Date(weekStart);
        for (let i = 0; i < 7; i++) {
          const day = new Date(start);
          day.setDate(start.getDate() + i);
          const dateStr = format(day, 'yyyy-MM-dd');
          const current = completionsMap.get(dateStr) || 0;
          completionsMap.set(dateStr, current + (Number(count) / 7));
        }
      });
    });
    return Array.from(completionsMap.entries()).map(([date, count]) => ({
      date,
      count: Math.round(count)
    }));
  }, [filteredTasks]);

  if (isLoading || isDashboardDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
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

  const { overallWeeklySummary } = analyticsData;
  const { patterns } = dashboardData;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-10 pb-32">
      <PageHeader title="Growth Analytics" backLink="/" />

      {/* JRPG Mastery Board */}
      <HabitLevelBars tasks={analyticsData.tasks} />

      <section className="bg-secondary p-2 rounded-2xl border border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 pl-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filter By</span>
        </div>
        <div className="flex items-center gap-3">
          <Select value={taskFilter} onValueChange={setTaskFilter}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl bg-card border-border font-bold text-xs">
              <SelectValue placeholder="All Tasks" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="all">All Tasks</SelectItem>
              {analyticsData.tasks.map(t => (
                <SelectItem key={t.task.id} value={t.task.id}>
                  {t.task.name}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Days Active', val: overallWeeklySummary.activeDays, icon: Calendar, color: 'text-info' },
          { label: 'Current Streak', val: overallWeeklySummary.streak, icon: Zap, color: 'text-warning' },
          { label: 'Consistency', val: `${patterns.consistency}%`, icon: TrendingUp, color: 'text-success' }
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

      <div className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Momentum Heatmap</h2>
        </div>
        <Card className="border-0 shadow-xl shadow-background/50 rounded-[2rem] p-6">
          <HabitHeatmap 
            completions={taskCompletions} 
            habitName={taskFilter === 'all' ? 'Overall Consistency' : 'Task Consistency'} 
            timeframe={timeframeFilter}
          />
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl shadow-sm border-0">
          <CardContent className="p-6 space-y-6">
            <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Task Performance
            </h3>
            {filteredTasks.map(summary => (
              <div key={summary.task.id} className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{summary.task.name}</p>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {summary.completionRate}% Consistency
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total Completions</span>
                  <span className="font-bold text-foreground">{summary.totalCompletions}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;