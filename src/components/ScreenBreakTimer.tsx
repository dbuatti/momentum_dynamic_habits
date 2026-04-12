"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { MonitorOff, Play, Square, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeDisplay } from "@/utils/time-utils";
import { useSimpleTasks } from "@/hooks/useSimpleTasks";
import { audioManager } from "@/utils/audio";
import { toast } from "sonner";

export function ScreenBreakTimer() {
  const { tasks, completeTask } = useSimpleTasks();
  const [isTiming, setIsTiming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const screenBreakTask = tasks.find(t => t.name === 'Screen Break');
  const targetSeconds = screenBreakTask?.current_value || 5;

  // Persistence logic
  useEffect(() => {
    const savedStartTime = localStorage.getItem('screen_break_start_time');
    if (savedStartTime) {
      const start = parseInt(savedStartTime);
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      setElapsedSeconds(diff);
      setIsTiming(true);
      
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleToggle = async () => {
    if (!isTiming) {
      // Start
      const now = Date.now();
      localStorage.setItem('screen_break_start_time', now.toString());
      setIsTiming(true);
      setElapsedSeconds(0);
      audioManager.playStart();
      
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      
      toast.info("Screen break started! Step away from the device.");
    } else {
      // Stop
      if (timerRef.current) clearInterval(timerRef.current);
      localStorage.removeItem('screen_break_start_time');
      setIsTiming(false);
      
      if (elapsedSeconds >= targetSeconds && screenBreakTask) {
        await completeTask(screenBreakTask.id);
        audioManager.playSuccess();
        toast.success("Break complete! Goal met.");
      } else {
        toast.error(`Break too short. Goal is ${targetSeconds}s.`);
      }
      
      setElapsedSeconds(0);
    }
  };

  if (!screenBreakTask) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleToggle}
        className={cn(
          "h-14 px-6 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg",
          isTiming 
            ? "bg-white text-orange-500 animate-pulse scale-105" 
            : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-md"
        )}
      >
        {isTiming ? (
          <div className="flex items-center gap-3">
            <Square className="w-5 h-5 fill-current" />
            <span className="tabular-nums">{formatTimeDisplay(elapsedSeconds)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <MonitorOff className="w-5 h-5" />
            <span>Break</span>
          </div>
        )}
      </Button>
      
      {isTiming && (
        <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 animate-in fade-in slide-in-from-top-2">
          <p className="text-[9px] font-black text-white/80 uppercase tracking-widest">
            Goal: {targetSeconds}s
          </p>
        </div>
      )}
    </div>
  );
}