"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Anchor, CheckCircle2, Target, Play, Lock, Loader2, Pause, Square, RotateCcw, Clock, Sparkles, FlaskConical, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessedUserHabit } from '@/types/habit';
import { habitIconMap, habitColorMap } from '@/lib/habit-utils';
import { useHabitLog } from '@/hooks/useHabitLog';
import { showError } from '@/utils/toast';
import { useFeedback } from '@/hooks/useFeedback';
import confetti from 'canvas-confetti';
import { formatTimeDisplay } from '@/utils/time-utils'; // Import from new utility

interface WeeklyAnchorCardProps {
  habit: ProcessedUserHabit;
  isLocked: boolean;
  dependentHabitName: string;
}

export const WeeklyAnchorCard: React.FC<WeeklyAnchorCardProps> = ({ 
  habit, 
  isLocked, 
  dependentHabitName 
}) => {
  const Icon = habitIconMap[habit.habit_key] || habitIconMap.custom_habit;
  const colorKey = habitColorMap[habit.habit_key] || 'indigo';
  const { mutate: logHabit, isPending: isLogging } = useHabitLog();
  const { triggerFeedback } = useFeedback();

  const minDuration = habit.weekly_session_min_duration || 10;
  const isCompleteForWeek = habit.weekly_progress >= habit.frequency_per_week;
  const progressPercentage = Math.min(100, (habit.weekly_progress / habit.frequency_per_week) * 100);
  
  const totalWeeklyTimeGoal = habit.frequency_per_week * habit.current_daily_goal;
  const weeklyTimeProgress = (habit as any).weekly_total_minutes || 0;
  const timeProgressPercentage = Math.min(100, (weeklyTimeProgress / totalWeeklyTimeGoal) * 100);

  const storageKey = `weeklyAnchorTimer:${habit.habit_key}`;
  const [isTiming, setIsTiming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (isTiming && !isPaused && !isCompleteForWeek) {
      stopInterval();
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      stopInterval();
    }
    return () => stopInterval();
  }, [isTiming, isPaused, isCompleteForWeek]);

  useEffect(() => {
    if (isCompleteForWeek) {
      localStorage.removeItem(storageKey);
      setIsTiming(false);
      return;
    }
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const { elapsed, paused, timing, startTime } = JSON.parse(saved);
      let calculatedElapsed = elapsed;
      if (timing && !paused) {
        calculatedElapsed += Math.floor((Date.now() - startTime) / 1000);
      }
      setIsPaused(paused);
      setIsTiming(timing);
      setElapsedTime(calculatedElapsed);
    }
  }, [isCompleteForWeek, storageKey]);

  useEffect(() => {
    if (isTiming && !isCompleteForWeek) {
      localStorage.setItem(storageKey, JSON.stringify({
        elapsed: elapsedTime,
        paused: isPaused,
        timing: isTiming,
        startTime: Date.now() - (elapsedTime * 1000)
      }));
    }
  }, [elapsedTime, isPaused, isTiming, isCompleteForWeek, storageKey]);

  const handleStartSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) return;
    triggerFeedback('start');
    setIsTiming(true);
    setIsPaused(false);
  };

  const handleEndSession = async () => {
    const elapsedMinutes = elapsedTime / 60;
    if (elapsedMinutes >= minDuration) {
      triggerFeedback('completion');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      await logHabit({
        habitKey: habit.habit_key,
        value: elapsedMinutes,
        taskName: `${habit.name} session`,
      });
      setIsTiming(false);
      setElapsedTime(0);
      localStorage.removeItem(storageKey);
    } else {
      showError(`Session too short. Must be at least ${minDuration} minutes.`);
    }
  };

  const colors = {
    indigo: { bg: 'bg-habit-indigo/10', border: 'border-habit-indigo-border/50', text: 'text-habit-indigo-foreground', progress: 'bg-habit-indigo-foreground', accent: 'bg-indigo-500' },
    orange: { bg: 'bg-habit-orange/10', border: 'border-habit-orange-border/50', text: 'text-habit-orange-foreground', progress: 'bg-habit-orange-foreground', accent: 'bg-orange-500' },
    blue: { bg: 'bg-habit-blue/10', border: 'border-habit-blue-border/50', text: 'text-habit-blue-foreground', progress: 'bg-habit-blue-foreground', accent: 'bg-blue-500' },
    green: { bg: 'bg-habit-green/10', border: 'border-habit-green-border/50', text: 'text-habit-green-foreground', progress: 'bg-habit-green-foreground', accent: 'bg-green-500' },
    purple: { bg: 'bg-habit-purple/10', border: 'border-habit-purple-border/50', text: 'text-habit-purple-foreground', progress: 'bg-habit-purple-foreground', accent: 'bg-purple-500' },
    red: { bg: 'bg-habit-red/10', border: 'border-habit-red-border/50', text: 'text-habit-red-foreground', progress: 'bg-habit-red-foreground', accent: 'bg-red-500' },
  }[colorKey];

  const progressToMin = Math.min(100, (elapsedTime / (minDuration * 60)) * 100);

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
                <Anchor className="w-2.5 h-2.5 inline-block mr-1" /> Anchor
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
            <p className="text-sm font-semibold text-success-foreground">Weekly goal met! You are consistent.</p>
          </div>
        ) : isTiming ? (
          <div className="space-y-4 pt-3 border-t border-border/50">
            <div className="flex justify-between items-center bg-card/40 p-5 rounded-2xl border border-white/20">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">Time Lapsed</span>
                <p className="text-3xl font-black tabular-nums">{formatTimeDisplay(elapsedTime)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}>
                  {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                </Button>
                <Button size="lg" className="h-12 px-6 rounded-xl font-black" onClick={(e) => { e.stopPropagation(); handleEndSession(); }}>
                  <Square className="w-4 h-4 mr-2 fill-current" /> Finish
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Session Progress ({minDuration}m)</span>
                <span>{Math.round(progressToMin)}%</span>
              </div>
              <Progress value={progressToMin} className={cn("h-1.5", `[&>div]:${colors.accent}`)} />
            </div>
          </div>
        ) : (
          <div className="space-y-6 pt-3 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Min Duration</p>
                 <p className="text-lg font-black">{minDuration} {habit.unit}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Weekly Frequency</p>
                 <p className="text-lg font-black">{habit.frequency_per_week}x week</p>
               </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Weekly Time</span>
                      <span className="text-[10px] font-black opacity-60">
                        {Math.round(weeklyTimeProgress)} / {totalWeeklyTimeGoal} {habit.unit}
                      </span>
                   </div>
                   <Progress value={timeProgressPercentage} className={cn("h-1.5", `[&>div]:${colors.accent}`)} />
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sessions Completed</span>
                      <span className="text-[10px] font-black opacity-60">{habit.weekly_progress} / {habit.frequency_per_week}</span>
                   </div>
                   <Progress value={progressPercentage} className={cn("h-1.5 opacity-60", `[&>div]:${colors.accent}`)} />
                </div>
            </div>

            <Button size="lg" className="w-full h-14 rounded-2xl font-black text-lg shadow-md" onClick={handleStartSession}>
              <Play className="w-5 h-5 mr-2 fill-current" /> Start Session
            </Button>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};