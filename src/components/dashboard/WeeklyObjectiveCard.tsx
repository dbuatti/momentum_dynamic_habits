"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarCheck, Target, Play, Lock, CheckCircle2, Clock, RotateCcw, Pause, Square, Loader2, Sparkles, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessedUserHabit } from '@/types/habit';
import { habitIconMap, habitColorMap } from '@/lib/habit-utils';
import { useHabitLog } from '@/hooks/useHabitLog';
import { useFeedback } from '@/hooks/useFeedback';
import { showSuccess } from '@/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface WeeklyObjectiveCardProps {
  habit: ProcessedUserHabit;
  isLocked: boolean;
  dependentHabitName: string;
}

const formatTime = (totalSeconds: number) => {
  const roundedTotalSeconds = Math.round(totalSeconds); 
  const mins = Math.floor(roundedTotalSeconds / 60);
  const secs = roundedTotalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const WeeklyObjectiveCard: React.FC<WeeklyObjectiveCardProps> = ({ 
  habit, 
  isLocked, 
  dependentHabitName
}) => {
  const { mutate: logHabit, isPending: isLogging } = useHabitLog();
  const { triggerFeedback } = useFeedback();
  
  const Icon = habitIconMap[habit.habit_key] || habitIconMap.custom_habit;
  const colorKey = habitColorMap[habit.habit_key] || 'blue';

  const sessionMinDuration = habit.weekly_session_min_duration || habit.current_daily_goal || 10; 
  const isCompleteForWeek = habit.weekly_progress >= habit.frequency_per_week;
  
  const totalWeeklyTimeGoal = habit.frequency_per_week * habit.current_daily_goal;
  const weeklyTimeProgress = (habit as any).weekly_total_minutes || 0;
  const timeProgressPercentage = Math.min(100, (weeklyTimeProgress / totalWeeklyTimeGoal) * 100);

  const storageKey = `weeklyObjectiveTimer:${habit.habit_key}`;
  const targetSeconds = sessionMinDuration * 60;
  const [isTiming, setIsTiming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(targetSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (isTiming && !isPaused && timeLeft > 0) {
      stopInterval();
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else {
      stopInterval();
    }
    return () => stopInterval();
  }, [isTiming, isPaused, timeLeft]);

  useEffect(() => {
    if (isTiming && timeLeft === 0) {
        handleEndSession();
        triggerFeedback('goal_reached');
    }
  }, [timeLeft, isTiming]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved && !isCompleteForWeek) {
      const { savedTime, paused, timing, lastUpdated } = JSON.parse(saved);
      let newTime = savedTime;
      if (timing && !paused) {
        const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
        newTime = Math.max(0, savedTime - elapsed);
      }
      setTimeLeft(newTime);
      setIsPaused(paused);
      setIsTiming(timing);
    }
  }, [isCompleteForWeek, storageKey]);

  useEffect(() => {
    if (isTiming) {
      localStorage.setItem(storageKey, JSON.stringify({
        savedTime: timeLeft,
        paused: isPaused,
        timing: isTiming,
        lastUpdated: Date.now()
      }));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [timeLeft, isPaused, isTiming]);

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    triggerFeedback('start');
    setIsTiming(true);
    setIsPaused(false);
  };

  const handleEndSession = async () => {
    const elapsedMinutes = (targetSeconds - timeLeft) / 60;
    const isSuccess = timeLeft === 0 || elapsedMinutes >= sessionMinDuration;

    if (isSuccess) {
      triggerFeedback('completion');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      await logHabit({
        habitKey: habit.habit_key,
        value: sessionMinDuration, 
        taskName: `${habit.name} session`,
      });
    } else {
      await logHabit({
        habitKey: habit.habit_key,
        value: elapsedMinutes,
        taskName: `${habit.name} session (partial)`,
      });
    }

    setIsTiming(false);
    setIsPaused(false);
    setTimeLeft(targetSeconds);
  };

  const colors = {
    indigo: { bg: 'bg-habit-indigo/10', border: 'border-habit-indigo-border/50', text: 'text-habit-indigo-foreground', fill: 'from-habit-indigo/40', accent: 'bg-indigo-500' },
    orange: { bg: 'bg-habit-orange/10', border: 'border-habit-orange-border/50', text: 'text-habit-orange-foreground', fill: 'from-habit-orange/40', accent: 'bg-orange-500' },
    blue: { bg: 'bg-habit-blue/10', border: 'border-habit-blue-border/50', text: 'text-habit-blue-foreground', fill: 'from-habit-blue/40', accent: 'bg-blue-500' },
    green: { bg: 'bg-habit-green/10', border: 'border-habit-green-border/50', text: 'text-habit-green-foreground', fill: 'from-habit-green/40', accent: 'bg-green-500' },
    purple: { bg: 'bg-habit-purple/10', border: 'border-habit-purple-border/50', text: 'text-habit-purple-foreground', fill: 'from-habit-purple/40', accent: 'bg-purple-500' },
    red: { bg: 'bg-habit-red/10', border: 'border-habit-red-border/50', text: 'text-habit-red-foreground', fill: 'from-habit-red/40', accent: 'bg-red-500' },
  }[colorKey];

  const progressPercent = Math.min(100, ((targetSeconds - timeLeft) / targetSeconds) * 100);

  return (
    <AccordionItem 
      value={habit.habit_key}
      className={cn(
        "rounded-[2rem] border-2 transition-all duration-500 overflow-hidden mb-4",
        colors.bg, colors.border,
        isCompleteForWeek ? "opacity-75 grayscale-[0.3]" : "shadow-md"
      )}
    >
      <AccordionTrigger className="px-6 py-5 hover:no-underline group">
        <div className="flex items-center gap-5 text-left w-full">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
            isCompleteForWeek ? "bg-success/20 text-success border-success/30" : "bg-card/90"
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-grow pr-2">
            <h3 className="font-black text-lg leading-tight truncate">
                {habit.name}
                {isCompleteForWeek && <CheckCircle2 className="w-5 h-5 text-success inline-block ml-2" />}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-card",
                colors.text, colors.border
              )}>
                <CalendarCheck className="w-2.5 h-2.5 inline-block mr-1" /> Objective
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                • {habit.weekly_progress}/{habit.frequency_per_week} Sessions
              </span>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-6 pb-6 pt-2 space-y-6">
        {isLocked ? (
          <div className="p-4 bg-muted/50 rounded-xl border border-border flex items-center gap-3">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Locked. Complete {dependentHabitName} first.</p>
          </div>
        ) : isCompleteForWeek ? (
          <div className="p-4 bg-success/20 rounded-2xl border border-success/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <p className="text-sm font-semibold text-success-foreground">Weekly target reached!</p>
          </div>
        ) : isTiming ? (
          <div className="space-y-4 pt-3 border-t border-border/50">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-card/40 p-5 rounded-2xl border border-white/20">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">Time Remaining</span>
                    <p className="text-3xl font-black tabular-nums">{formatTime(timeLeft)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}>
                    {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                  </Button>
                  <Button size="lg" className="h-12 px-6 rounded-xl font-black" onClick={(e) => { e.stopPropagation(); handleEndSession(); }}>
                    <Square className="w-4 h-4 mr-2 fill-current" /> End
                  </Button>
                </div>
             </div>
             <Progress value={progressPercent} className={cn("h-1.5", `[&>div]:${colors.accent}`)} />
          </div>
        ) : (
          <div className="space-y-6 pt-3 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Session Goal</p>
                 <p className="text-lg font-black">{sessionMinDuration} {habit.unit}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Weekly Goal</p>
                 <p className="text-lg font-black">{habit.frequency_per_week}x week</p>
               </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Weekly Time Invested</span>
                      <span className="text-[10px] font-black opacity-60">
                        {Math.round(weeklyTimeProgress)} / {totalWeeklyTimeGoal} {habit.unit}
                      </span>
                   </div>
                   <Progress value={timeProgressPercentage} className={cn("h-1.5", `[&>div]:${colors.accent}`)} />
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Session Progress</span>
                      <span className="text-[10px] font-black opacity-60">{habit.weekly_progress} / {habit.frequency_per_week}</span>
                   </div>
                   <Progress value={progressPercentage} className={cn("h-1.5 opacity-60", `[&>div]:${colors.accent}`)} />
                </div>
            </div>

            <Button size="lg" className="w-full h-14 rounded-2xl font-black text-lg shadow-md" onClick={handleStart}>
              <Play className="w-5 h-5 mr-2 fill-current" /> Start Session
            </Button>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};