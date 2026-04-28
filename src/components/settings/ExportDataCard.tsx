"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ClipboardCheck, Loader2 } from 'lucide-react';
import { useSimpleTasks } from '@/hooks/useSimpleTasks';
import { useIsMobile } from '@/hooks/use-mobile';
import { showSuccess, showError } from '@/utils/toast';

export const ExportDataCard: React.FC = () => {
  const isMobile = useIsMobile();
  const { tasks, loading: isLoadingTasks } = useSimpleTasks();

  // Only show on desktop
  if (isMobile) return null;

  const handleExport = async () => {
    try {
      if (!tasks) {
        showError("Data not ready for export.");
        return;
      }

      // Focus specifically on the simple_tasks table data
      const exportData = {
        export_type: "simple_tasks_backup",
        timestamp: new Date().toISOString(),
        data: tasks.map(t => ({
          id: t.id,
          name: t.name,
          type: t.task_type,
          current_goal_value: t.current_value,
          increment_per_level: t.increment_value,
          mastery_level: t.habit_level,
          total_xp: t.habit_xp,
          is_active: t.is_active,
          last_updated: t.updated_at,
          last_skipped: t.last_skipped_at,
          completed_today: t.completed_today
        }))
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      
      showSuccess("Simple Tasks data exported to clipboard!");
    } catch (err) {
      console.error("Export failed:", err);
      showError("Failed to copy data to clipboard.");
    }
  };

  return (
    <Card className="rounded-3xl shadow-sm border border-border bg-card">
      <CardHeader className="p-6 pb-0">
        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Download className="w-4 h-4" /> Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-bold">Export Simple Tasks</p>
          <p className="text-xs text-muted-foreground">
            Copy a full backup of your simple tasks (including Screen Break) and their mastery progress to your clipboard.
          </p>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full h-12 rounded-2xl font-bold border-primary/20 hover:bg-primary/5"
          onClick={handleExport}
          disabled={isLoadingTasks}
        >
          {isLoadingTasks ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <ClipboardCheck className="w-5 h-5 mr-2" />
          )}
          {isLoadingTasks ? 'Loading Data...' : 'Copy JSON to Clipboard'}
        </Button>
      </CardContent>
    </Card>
  );
};