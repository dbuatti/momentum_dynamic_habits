"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { MonitorOff, Square, Loader2, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeDisplay } from "@/utils/time-utils";
import { useSimpleTasks } from "@/hooks/useSimpleTasks";
import { audioManager } from "@/utils/audio";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export function ScreenBreakTimer() {
  const { session } = useSession();
  const { tasks, completeTask, refresh } = useSimpleTasks();
  const [isTiming, setIsTiming] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSyncing, setIsSyncing] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const screenBreakTask = tasks.find(t => t.name === 'Screen Break');
  const targetSeconds = screenBreakTask?.current_value || 5;

  // Ensure the task exists if it's missing
  useEffect(() => {
    const ensureTaskExists = async () => {
      if (!session?.user?.id || tasks.length === 0 || screenBreakTask) return;
      
      // If tasks are loaded but Screen Break is missing, create it
      const { error } = await supabase
        .from('simple_tasks')
        .insert({
          user_id: session.user.id,
          name: 'Screen Break',
          task_type: 'time',
          current_value: 5,
          increment_value: 5
        });
      
      if (!error) refresh();
    };

    ensureTaskExists();
  }, [tasks, screenBreakTask, session, refresh]);

  // Fetch active timer from Supabase on mount
  useEffect(() => {
    const fetchActiveTimer = async () => {
      if (!session?.user?.id) return;
      
      const { data, error } = await supabase
        .from('active_timers')
        .select('start_time')
        .eq('user_id', session.user.id)
        .eq('timer_type', 'screen_break')
        .maybeSingle();

      if (data) {
        const start = new Date(data.start_time).getTime();
        setStartTime(start);
        setIsTiming(true);
      }
      setIsSyncing(false);
    };

    fetchActiveTimer();
  }, [session]);

  // Local ticker
  useEffect(() => {
    if (isTiming && startTime) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      const update = () => {
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      };
      
      update();
      timerRef.current = setInterval(update, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTiming, startTime]);

  const handleToggle = async () => {
    if (!session?.user?.id) return;
    setIsSyncing(true);

    if (!isTiming) {
      // Start: Save to Supabase
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('active_timers')
        .upsert({ 
          user_id: session.user.id, 
          timer_type: 'screen_break', 
          start_time: now 
        });

      if (!error) {
        setStartTime(new Date(now).getTime());
        setIsTiming(true);
        audioManager.playStart();
        toast.info("Break started. Step away!");
      }
    } else {
      // Stop: Remove from Supabase and log completion
      const { error } = await supabase
        .from('active_timers')
        .delete()
        .eq('user_id', session.user.id)
        .eq('timer_type', 'screen_break');

      if (!error) {
        setIsTiming(false);
        setStartTime(null);
        
        if (elapsedSeconds >= targetSeconds && screenBreakTask) {
          await completeTask(screenBreakTask.id);
          audioManager.playSuccess();
          toast.success("Break complete!");
        } else {
          toast.error(`Too short! Goal was ${targetSeconds}s.`);
        }
      }
    }
    setIsSyncing(false);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleToggle}
        disabled={isSyncing}
        variant="ghost"
        className={cn(
          "h-12 w-12 rounded-full p-0 transition-all duration-500 border-2",
          isTiming 
            ? "bg-white text-orange-500 shadow-xl scale-110 border-white animate-pulse" 
            : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white border-white/10"
        )}
        title={isTiming ? "Stop Break" : "Start Screen Break"}
      >
        {isSyncing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isTiming ? (
          <Square className="w-5 h-5 fill-current" />
        ) : (
          <Coffee className="w-6 h-6" />
        )}
      </Button>
      
      {isTiming && (
        <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-black text-white uppercase tabular-nums tracking-widest">
            {formatTimeDisplay(elapsedSeconds)}
          </p>
        </div>
      )}
    </div>
  );
}