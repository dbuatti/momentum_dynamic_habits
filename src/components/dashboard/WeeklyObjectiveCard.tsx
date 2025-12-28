"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CalendarCheck, Target, Play, Lock, 
  CheckCircle2, Clock, RotateCcw, 
  Pause, Square, Loader2, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessedUserHabit } from '@/types/habit';
import { habitIconMap, habitColorMap } from '@/lib/habit-utils';
import { useHabitLog } from '@/hooks/useHabitLog';
import { useFeedback } from '@/hooks/useFeedback';
import { showSuccess } from '@/utils/toast'; // Added missing import
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
  
  // Timer State
  const storageKey = `weeklyObjectiveTimer:${habit.habit_key}`;
  const targetSeconds = sessionMinDuration * 60;
  const [isTiming, setIsTiming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(targetSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const colors = {
    indigo: { bg: 'bg-habit-indigo/10', border: 'border-habit-indigo-border/50', text: 'text-habit-indigo-foreground', fill: 'from-habit-indigo/40', accent: 'bg-habit-indigo-foreground' },
    orange: { bg: 'bg-habit-orange/10', border: 'border-habit-orange-border/50', text: 'text-habit-orange-foreground', fill: 'from-habit-orange/40', accent: 'bg-habit-orange-foreground' },
    blue: { bg: 'bg-habit-blue/10', border: 'border-habit-blue-border/50', text: 'text-habit-blue-foreground', fill: 'from-habit-blue/40', accent: 'bg-habit-blue-foreground' },
    green: { bg: 'bg-habit-green/10', border: 'border-habit-green-border/50', text: 'text-habit-green-foreground', fill: 'from-habit-green/40', accent: 'bg-habit-green-foreground' },
    purple: { bg: 'bg-habit-purple/10', border: 'border-habit-purple-border/50', text: 'text-habit-purple-foreground', fill: 'from-habit-purple/40', accent: 'bg-habit-purple-foreground' },
    red: { bg: 'bg-habit-red/10', border: 'border-habit-red-border/50', text: 'text-habit-red-foreground', fill: 'from-habit-red/40', accent: 'bg-habit-red-foreground' },
  }[colorKey];

  // --- Interval Management ---
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

  // Handle auto-finish
  useEffect(() => {
    if (isTiming && timeLeft === 0) {
        handleEndSession();
        triggerFeedback('goal_reached');
    }
  }, [timeLeft, isTiming]);

  // Persist State
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
      
      // Dispatch for FloatingTimer/Tab title
      window.dispatchEvent(new CustomEvent('habit-timer-update', {
        detail: {
          label: 'Weekly Goal',
          remaining: timeLeft, 
          isPaused,
          habitKey: habit.habit_key,
          habitName: habit.name,
          goalValue: sessionMinDuration
        }
      }));
    } else {
      localStorage.removeItem(storageKey);
      window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
    }
  }, [timeLeft, isPaused, isTiming]);

  const handleStart = () => {
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
        value: sessionMinDuration, // Log the full session credit
        taskName: `${habit.name} session`,
      });
    } else {
      // Partial credit if stopped early
      await logHabit({
        habitKey: habit.habit_key,
        value: elapsedMinutes,
        taskName: `${habit.name} session (partial)`,
      });
      showSuccess(`Progress saved: ${Math.round(elapsedMinutes)} minutes.`);
    }

    setIsTiming(false);
    setIsPaused(false);
    setTimeLeft(targetSeconds);
  };

  const progressPercent = Math.min(100, ((targetSeconds - timeLeft) / targetSeconds) * 100);

  return (
    <Card 
      id={`habit-card-${habit.habit_key}`}
      className={cn(
        "rounded-[2rem] shadow-xl border-2 transition-all duration-700 overflow-hidden relative",
        colors.bg, colors.border,
        isLocked && "opacity-50 grayscale-[0.5]",
        isCompleteForWeek && "bg-success/5 border-success/30 opacity-80"
      )}
    >
      {/* Liquid Animation Background */}
      <AnimatePresence>
        {isTiming && (
          <motion.div
            className="absolute inset-x-0 bottom-0 z-0 pointer-events-none"
            initial={{ height: '0%' }}
            animate={{ height: `${progressPercent}%` }}
            transition={{ duration: 1 }}
          >
            <div className={cn('absolute inset-0 bg-gradient-to-t opacity-20', colors.fill, 'to-transparent')} />
          </motion.div>
        )}
      </AnimatePresence>

      <CardContent className="p-6 space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
              isCompleteForWeek ? "bg-success/20 text-success border-success/30" : "bg-card/90 border-border"
            )}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-xl leading-tight">{habit.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-card",
                  colors.text, colors.border
                )}>
                  <CalendarCheck className="w-3 h-3 inline-block mr-1" />
                  Weekly Objective
                </span>
              </div>
            </div>
          </div>
          
          {isCompleteForWeek && (
            <div className="flex flex-col items-end text-success">
              <CheckCircle2 className="w-7 h-7" />
              <span className="text-[10px] font-black uppercase mt-1">Goal Reached</span>
            </div>
          )}
        </div>

        {isLocked ? (
          <div className="p-5 bg-muted/30 rounded-2xl border-2 border-dashed border-border flex items-center gap-3">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm font-bold text-muted-foreground italic">
              Complete {dependentHabitName} to unlock this objective.
            </p>
          </div>
        ) : isCompleteForWeek ? (
          <div className="p-4 bg-success/20 rounded-2xl border border-success/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <p className="text-sm font-bold text-success-foreground">Consistency verified. You've hit your target for this week!</p>
          </div>
        ) : isTiming ? (
          /* Active Timer View */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-card/40 p-6 rounded-[1.5rem] border border-white/20 shadow-inner">
                <div className="flex flex-col items-center sm:items-start">
                    <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-1">Session Remaining</span>
                    <p className="text-5xl font-black tabular-nums tracking-tighter leading-none">{formatTime(timeLeft)}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button 
                    size="icon" variant="ghost" 
                    className="h-14 w-14 rounded-full bg-card/90 shadow-xl border border-border/30" 
                    onClick={() => { setTimeLeft(targetSeconds); setIsTiming(false); }}
                  >
                    <RotateCcw className="w-6 h-6 opacity-60" />
                  </Button>
                  <Button 
                    size="icon" variant="ghost" 
                    className="h-14 w-14 rounded-full bg-card/90 shadow-xl border border-border/30" 
                    onClick={() => setIsPaused(!isPaused)}
                  >
                    {isPaused ? <Play className="w-8 h-8 ml-1 fill-current" /> : <Pause className="w-8 h-8 fill-current" />}
                  </Button>
                  <Button 
                    size="lg" 
                    className="h-14 px-8 rounded-full font-black shadow-2xl bg-primary text-primary-foreground" 
                    onClick={handleEndSession}
                  >
                    <Square className="w-4 h-4 mr-2 fill-current" /> End
                  </Button>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                    <span>Session Progress</span>
                    <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className={cn("h-1.5", `[&>div]:${colors.accent}`)} />
            </div>
          </div>
        ) : (
          /* Idle View */
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-4 rounded-2xl bg-card/50 border border-border/50 shadow-inner">
                    <p className="text-[9px] font-black uppercase opacity-50 tracking-widest text-muted-foreground flex items-center gap-1">
                        <Target className="w-3 h-3" /> Min Session
                    </p>
                    <p className="text-xl font-black text-foreground">
                        {sessionMinDuration} {habit.unit}
                    </p>
                </div>
                <div className="space-y-1 p-4 rounded-2xl bg-card/50 border border-border/50 shadow-inner">
                    <p className="text-[9px] font-black uppercase opacity-50 tracking-widest text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Weekly Progress
                    </p>
                    <p className="text-xl font-black text-foreground">
                        {habit.weekly_progress} / {habit.frequency_per_week}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
              <Progress 
                value={(habit.weekly_progress / habit.frequency_per_week) * 100} 
                className={cn("h-2", `[&>div]:${colors.accent}`)} 
              />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                {habit.frequency_per_week - habit.weekly_progress} sessions remaining this week
              </p>
            </div>

            <Button
              size="lg"
              className="w-full h-16 rounded-[1.25rem] font-black text-lg shadow-xl hover:scale-[1.02] transition-transform active:scale-95"
              onClick={handleStart}
              disabled={isLocked}
            >
              {isLogging ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Play className="w-6 h-6 mr-2 fill-current" /> Start Session</>}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};