"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { MonitorOff, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeDisplay } from "@/utils/time-utils";
import { useSimpleTasks } from "@/hooks/useSimpleTasks";
import { audioManager } from "@/utils/audio";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export function ScreenBreakTimer() {
  const { session } = useSession();
  const { tasks, completeTask } = useSimpleTasks();
  const [isTiming, setIsTiming] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSyncing, setIsSyncing] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const screenBreakTask = tasks.find(t => t.name === 'Screen Break');
  const targetSeconds = screenBreakTask?.current_value || 5;

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

  if (!screenBreakTask) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleToggle}
        disabled={isSyncing}
        variant="ghost"
        className={cn(
          "h-10 w-10 rounded-full p-0 transition-all duration-500 border border-white/10",
          isTiming 
            ? "bg-white text-orange-500 shadow-lg scale-110 animate-pulse" 
            : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
        )}
      >
        {isSyncing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isTiming ? (
          <Square className="w-4 h-4 fill-current" />
        ) : (
          <MonitorOff className="w-5 h-5" />
        )}
      </Button>
      
      {isTiming && (
        <div className="bg-black/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/5 animate-in fade-in slide-in-from-top-1">
          <p className="text-[8px] font-black text-white/60 uppercase tabular-nums">
            {formatTimeDisplay(elapsedSeconds)}
          </p>
        </div>
      )}
    </div>
  );
}