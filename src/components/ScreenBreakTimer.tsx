"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Square, Loader2, Coffee, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeDisplay } from "@/utils/time-utils";
import { useSimpleTasks } from "@/hooks/useSimpleTasks";
import { audioManager } from "@/utils/audio";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { getLevelXpStats } from '@/utils/habit-leveling';
import { motion } from 'framer-motion';

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

  // Calculate mastery progress for the ring
  const masteryStats = useMemo(() => {
    if (!screenBreakTask) return { progress: 0, level: 1 };
    const stats = getLevelXpStats(screenBreakTask.habit_xp || 0);
    return {
      progress: (stats.xpInLevel / stats.xpNeededForNext) * 100,
      level: stats.currentLevel
    };
  }, [screenBreakTask]);

  useEffect(() => {
    const ensureTaskExists = async () => {
      if (!session?.user?.id || tasks.length === 0 || screenBreakTask) return;
      
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

  // SVG Ring Constants
  const size = 64;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (masteryStats.progress / 100) * circumference;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="relative flex items-center justify-center w-16 h-16">
        {/* Mastery Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/10"
          />
          {/* Progress Fill */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="white"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          />
        </svg>

        <Button
          onClick={handleToggle}
          disabled={isSyncing}
          variant="ghost"
          className={cn(
            "h-14 w-14 rounded-full p-0 transition-all duration-500 border-2 z-10",
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
        
        {!isTiming && !isSyncing && (
          <div className="absolute -bottom-1 -right-1 bg-white text-orange-500 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-orange-100 flex items-center gap-0.5 z-20">
            <Target className="w-2 h-2" />
            {targetSeconds}s
          </div>
        )}
      </div>
      
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