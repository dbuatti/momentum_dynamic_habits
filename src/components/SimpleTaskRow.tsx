"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { SimpleTask } from "@/hooks/useSimpleTasks";
import { Check, Timer, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleTaskRowProps {
  task: SimpleTask;
  onComplete: (taskId: string) => Promise<any>;
}

export function SimpleTaskRow({ task, onComplete }: SimpleTaskRowProps) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(task.id);
    setCompleting(false);
  };

  const isTimeTask = task.task_type === 'time';

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-2xl transition-all duration-500",
      "bg-white/5 border border-white/10 hover:bg-white/10",
      task.completed_today && "border-green-500/20 bg-green-500/5"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
          task.completed_today ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/60"
        )}>
          {isTimeTask ? <Timer className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <p className={cn(
            "font-black text-sm uppercase tracking-tight truncate",
            task.completed_today ? "text-white/60" : "text-white"
          )}>
            {task.name}
          </p>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
            {task.current_value} {isTimeTask ? 'seconds' : 'reps'}
          </p>
        </div>
      </div>
      
      <Button
        size="sm"
        onClick={handleComplete}
        disabled={completing}
        className={cn(
          "h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95",
          task.completed_today 
            ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
            : "bg-white text-orange-500 hover:bg-white/90"
        )}
      >
        {completing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : task.completed_today ? (
          <Check className="w-4 h-4 stroke-[4]" />
        ) : (
          "Log"
        )}
      </Button>
    </div>
  );
}