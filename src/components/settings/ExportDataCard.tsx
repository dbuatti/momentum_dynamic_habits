"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ClipboardCheck, Loader2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useSimpleTasks } from '@/hooks/useSimpleTasks';
import { useIsMobile } from '@/hooks/use-mobile';
import { showSuccess, showError } from '@/utils/toast';

export const ExportDataCard: React.FC = () => {
  const isMobile = useIsMobile();
  const { data: dashboardData, isLoading: isLoadingDashboard } = useDashboardData();
  const { tasks, loading: isLoadingTasks } = useSimpleTasks();

  // Only show on desktop
  if (isMobile) return null;

  const handleExport = async () => {
    try {
      if (!dashboardData || !tasks) {
        showError("Data not ready for export.");
        return;
      }

      const exportData = {
        timestamp: new Date().toISOString(),
        user: {
          name: `${dashboardData.firstName || ''} ${dashboardData.lastName || ''}`.trim(),
          streak: dashboardData.patterns.streak,
          daysActive: dashboardData.daysActive,
        },
        habits: dashboardData.habits.map(h => ({
          name: h.name,
          key: h.habit_key,
          level: h.habit_level,
          xp: h.habit_xp,
          category: h.category,
          dailyGoal: h.current_daily_goal,
          unit: h.unit,
          totalProgress: h.lifetime_progress
        })),
        simpleTasks: tasks.map(t => ({
          name: t.name,
          type: t.task_type,
          level: t.habit_level,
          xp: t.habit_xp,
          currentValue: t.current_value,
          unit: t.task_type === 'time' ? 'seconds' : 'reps'
        }))
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      
      showSuccess("Data exported to clipboard as JSON!");
    } catch (err) {
      console.error("Export failed:", err);
      showError("Failed to copy data to clipboard.");
    }
  };

  const isLoading = isLoadingDashboard || isLoadingTasks;

  return (
    <Card className="rounded-3xl shadow-sm border border-border bg-card">
      <CardHeader className="p-6 pb-0">
        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Download className="w-4 h-4" /> Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-bold">Export Growth Data</p>
          <p className="text-xs text-muted-foreground">
            Copy your habits, levels, and XP progress to your clipboard as a JSON object.
          </p>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full h-12 rounded-2xl font-bold border-primary/20 hover:bg-primary/5"
          onClick={handleExport}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <ClipboardCheck className="w-5 h-5 mr-2" />
          )}
          {isLoading ? 'Loading Data...' : 'Copy JSON to Clipboard'}
        </Button>
      </CardContent>
    </Card>
  );
};