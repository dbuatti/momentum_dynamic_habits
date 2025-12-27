"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Anchor, Calendar, CheckCircle2, Target, Play, Lock, Info, Loader2, Check, Pause, Square, RotateCcw, Clock, Sparkles, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessedUserHabit } from '@/types/habit';
import { habitIconMap, habitColorMap } from '@/lib/habit-utils';
import { useHabitLog } from '@/hooks/useHabitLog';
import { showError, showSuccess } from '@/utils/toast';
import { useFeedback } from '@/hooks/useFeedback';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';

interface WeeklyAnchorCardProps {
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

export const WeeklyAnchorCard: React.FC<WeeklyAnchorCardProps> = ({ 
  habit, 
  isLocked, 
  dependentHabitName 
}) => {
  const Icon = habitIconMap[habit.habit_key] || habitIconMap.custom_habit;
  const colorKey = habitColorMap[habit.habit_key] || 'indigo';
  const { mutate: logHabit, isPending: isLogging } = useHabitLog();
  const { triggerFeedback } = useFeedback();

  const minDuration = habit.weekly_session_min_duration || 10; // In minutes
  const goalDuration = habit.current_daily_goal; // In minutes

  const isCompleteForWeek = habit.weekly_progress >= habit.frequency_per_week;
  const progressPercentage = Math.min(100, (habit.weekly_progress / habit.frequency_per_week) * 100);
  
  // Timer State Management
  const storageKey = `weeklyAnchorTimer:${habit.habit_key}`;
  const [isTiming, setIsTiming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // In seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startInterval = useCallback(() => {
    stopInterval();
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, []);

  // Load/Save state from localStorage
  useEffect(() => {
    if (isCompleteForWeek) {
      localStorage.removeItem(storageKey);
      setIsTiming(false);
      setElapsedTime(0);
      return;
    }
    
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const { elapsed, paused, timing, startTime } = JSON.parse(saved);
      const now = Date.now();
      
      let calculatedElapsed = elapsed;
      if (timing && !paused) {
        // Recalculate elapsed time since last save
        calculatedElapsed += Math.floor((now - startTime) / 1000);
      }
      
      setIsPaused(paused);
      setIsTiming(timing);
      setElapsedTime(calculatedElapsed);
      
      if (timing && !paused) {
        startInterval();
      }
    }
    
    return () => {
      stopInterval();
    };
  }, [isCompleteForWeek, storageKey, startInterval]);

  useEffect(() => {
    if (isTiming && !isCompleteForWeek) {
      localStorage.setItem(storageKey, JSON.stringify({
        elapsed: elapsedTime,
        paused: isPaused,
        timing: isTiming,
        startTime: Date.now() - (elapsedTime * 1000) // Approximate start time
      }));
    }
  }, [elapsedTime, isPaused, isTiming, isCompleteForWeek, storageKey]);

  // Handle Timer Actions
  const handleStartSession = () => {
    if (isLocked) {
      showError(`Please complete ${dependentHabitName} first.`);
      return;
    }
    triggerFeedback('start');
    setIsTiming(true);
    setIsPaused(false);
    startInterval();
  };

  const handlePauseSession = () => {
    triggerFeedback('pause');
    setIsPaused(true);
    stopInterval();
  };

  const handleResumeSession = () => {
    triggerFeedback('start');
    setIsPaused(false);
    startInterval();
  };

  const handleEndSession = (mood?: string) => {
    stopInterval();
    setIsTiming(false);
    setIsPaused(false);
    localStorage.removeItem(storageKey);
    
    const elapsedMinutes = elapsedTime / 60;
    
    // Rule 4: Check if elapsed time meets minimum duration
    const isSessionComplete = elapsedMinutes >= minDuration;

    if (isSessionComplete) {
      triggerFeedback('completion');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      
      // Log the actual elapsed time, but mark it as a full session completion for the weekly goal logic in useHabitLog
      logHabit({
        habitKey: habit.habit_key,
        value: elapsedMinutes, // Log actual minutes
        taskName: `${habit.name} session`,
        note: mood,
      });
    } else {
      showError(`Session too short (${Math.round(elapsedMinutes)} min). Must be at least ${minDuration} minutes to count as a full session.`);
      setElapsedTime(0); // Reset timer if failed
    }
  };

  const handleResetTimer = () => {
    stopInterval();
    setIsTiming(false);
    setIsPaused(false);
    setElapsedTime(0);
    localStorage.removeItem(storageKey);
  };

  const colors = {
    indigo: { bg: 'bg-habit-indigo/10', border: 'border-habit-indigo-border/50', text: 'text-habit-indigo-foreground', progress: 'bg-habit-indigo-foreground' },
    orange: { bg: 'bg-habit-orange/10', border: 'border-habit-orange-border/50', text: 'text-habit-orange-foreground', progress: 'bg-habit-orange-foreground' },
    blue: { bg: 'bg-habit-blue/10', border: 'border-habit-blue-border/50', text: 'text-habit-blue-foreground', progress: 'bg-habit-blue-foreground' },
    green: { bg: 'bg-habit-green/10', border: 'border-habit-green-border/50', text: 'text-habit-green-foreground', progress: 'bg-habit-green-foreground' },
    purple: { bg: 'bg-habit-purple/10', border: 'border-habit-purple-border/50', text: 'text-habit-purple-foreground', progress: 'bg-habit-purple-foreground' },
    red: { bg: 'bg-habit-red/10', border: 'border-habit-red-border/50', text: 'text-habit-red-foreground', progress: 'bg-habit-red-foreground' },
  }[colorKey];

  const progressToGoal = Math.min(100, (elapsedTime / (goalDuration * 60)) * 100);
  const progressToMin = Math.min(100, (elapsedTime / (minDuration * 60)) * 100);
  const isMinMet = elapsedTime >= (minDuration * 60);

  const daysRemainingInPlateau = habit.plateau_days_required - habit.completions_in_plateau;

  return (
    <Card className={cn(
      "rounded-3xl shadow-lg border-2 transition-all duration-300",
      colors.bg, colors.border,
      isLocked && "opacity-50 grayscale-[0.5]",
      isCompleteForWeek && "bg-success/10 border-success/30"
    )}>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
              isCompleteForWeek ? "bg-success/20 text-success border-success/30" : "bg-card/90 border-border"
            )}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight">{habit.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                  colors.text, colors.border, colors.bg
                )}>
                  <Anchor className="w-3 h-3 inline-block mr-1" />
                  Weekly Anchor
                </span>
              </div>
            </div>
          </div>
          
          {isCompleteForWeek && (
            <div className="flex flex-col items-end text-success">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-xs font-bold mt-1">Complete</span>
            </div>
          )}
        </div>

        {isLocked ? (
          <div className="p-4 bg-muted/50 rounded-xl border border-border flex items-center gap-3">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Locked. Complete {dependentHabitName} first.</p>
          </div>
        ) : isCompleteForWeek ? (
          <div className="p-4 bg-success/20 rounded-xl border border-success/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <p className="text-sm font-semibold text-success-foreground">Weekly goal met! You are consistent.</p>
          </div>
        ) : isTiming ? (
          // Timer View
          <div className="space-y-4 pt-3 border-t border-border/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session in Progress</span>
              </div>
              <p className="text-3xl font-black tabular-nums text-foreground">
                {formatTime(elapsedTime)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>Progress to Goal ({goalDuration} {habit.unit})</span>
                <span className={cn(isMinMet && "text-success-foreground font-bold")}>
                  {isMinMet ? 'Minimum Met!' : `${Math.round(progressToMin)}% to minimum (${minDuration} min)`}
                </span>
              </div>
              <Progress value={progressToGoal} className={cn("h-2", `[&>div]:${colors.progress}`)} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-2xl"
                onClick={handleResetTimer}
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button 
                variant={isPaused ? "default" : "outline"} 
                size="icon" 
                className="h-12 w-12 rounded-2xl"
                onClick={isPaused ? handleResumeSession : handlePauseSession}
              >
                {isPaused ? <Play className="w-6 h-6 ml-0.5 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
              </Button>
              <Button 
                size="lg" 
                className="flex-1 h-12 rounded-2xl font-black text-base shadow-md" 
                onClick={() => handleEndSession()}
                disabled={isLogging}
              >
                {isLogging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-4 h-4 mr-2 fill-current" />}
                End Session
              </Button>
            </div>
          </div>
        ) : (
          // Idle View
          <div className="space-y-4">
            {/* Trial Framing Block (D) */}
            {habit.is_trial_mode && (
              <div className="p-4 bg-info-background/50 rounded-xl border border-info-border/50 space-y-2">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-info" />
                  <span className="text-xs font-black uppercase tracking-widest text-info-foreground">Trial Mode Active</span>
                </div>
                <p className="text-sm font-medium text-foreground leading-tight">
                  Goal: 1 session · {minDuration} {habit.unit} minimum
                </p>
                <p className="text-xs text-muted-foreground">
                  Focus on consistency. {daysRemainingInPlateau} days left in trial plateau.
                  <Link to="/help" className="text-primary ml-1 hover:underline">Learn why.</Link>
                </p>
              </div>
            )}
            
            <div className="space-y-3 pt-3 border-t border-border/50">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-muted-foreground">Sessions Logged This Week</span>
                <span className="text-foreground tabular-nums">
                  {habit.weekly_progress} / {habit.frequency_per_week}
                </span>
              </div>
              <Progress value={progressPercentage} className={cn("h-2", `[&>div]:${colors.progress}`)} />
            </div>

            <Button
              size="lg"
              className="w-full h-12 px-8 rounded-2xl font-black text-base shadow-md"
              onClick={handleStartSession}
              disabled={isLocked || isLogging}
            >
              {isLogging ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2 fill-current" /> Start Session
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};