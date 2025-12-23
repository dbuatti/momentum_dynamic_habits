"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, Smile, Meh, Frown, Undo2, Play, Pause, Square, Edit2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playStartSound, playEndSound, playGoalSound } from '@/utils/audio';

interface HabitCapsuleProps {
  id: string;
  habitKey: string;
  habitName: string;
  label: string;
  value: number; // This is the target value for THIS CAPSULE
  unit: string;
  isCompleted: boolean;
  initialValue?: number; // This is the progress already made towards THIS CAPSULE's value
  scheduledTime?: string;
  onLogProgress: (actualValue: number, isComplete: boolean, mood?: string) => void; // Changed prop name and signature
  onUncomplete: () => void;
  color: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo';
  showMood?: boolean;
}

export const HabitCapsule: React.FC<HabitCapsuleProps> = ({
  habitKey,
  habitName,
  label,
  value, // Target value for this specific capsule
  unit,
  isCompleted,
  initialValue = 0, // Progress already made towards this capsule's value
  scheduledTime,
  onLogProgress, // Changed prop name
  onUncomplete,
  color,
  showMood,
}) => {
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [isTiming, setIsTiming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0); // Elapsed time for the current timer session
  const [isPaused, setIsPaused] = useState(false);
  const [goalReachedAlerted, setGoalReachedAlerted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isTimeBased = unit === 'min';
  
  // Unique storage key for each capsule for the current day
  const storageKey = `timer_${habitKey}_${label}_${new Date().toISOString().split('T')[0]}`;

  // Helper function for formatting time
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stopInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startInterval = useCallback(() => {
    stopInterval();
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now();
        const totalElapsed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedSeconds(totalElapsed);
        
        // Dispatch event for floating timer
        window.dispatchEvent(new CustomEvent('habit-timer-update', { 
          detail: { 
            label, 
            habitName,
            goalValue: value,
            elapsed: initialValue * 60 + totalElapsed, // Total elapsed including initial progress
            isPaused: false,
            habitKey 
          } 
        }));
      }
    }, 1000);
  }, [label, initialValue, habitKey, habitName, value]);

  // Alert when capsule goal is reached
  useEffect(() => {
    if (isTiming && isTimeBased && !goalReachedAlerted) {
      const totalMinutes = (initialValue * 60 + elapsedSeconds) / 60;
      if (totalMinutes >= value) {
        playGoalSound();
        if (window.navigator?.vibrate) window.navigator.vibrate([100, 50, 100]);
        setGoalReachedAlerted(true);
      }
    }
  }, [elapsedSeconds, isTiming, isTimeBased, value, initialValue, goalReachedAlerted]);

  // Load state from local storage on mount
  useEffect(() => {
    if (isCompleted) {
      localStorage.removeItem(storageKey);
      setIsTiming(false);
      setElapsedSeconds(0);
      setIsPaused(false);
      setGoalReachedAlerted(false);
      startTimeRef.current = null;
      return;
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const { start, elapsed, paused, timing } = JSON.parse(saved);
      setIsPaused(paused);
      setIsTiming(timing);
      
      if (timing && !paused) {
        startTimeRef.current = start;
        setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
        startInterval();
      } else {
        setElapsedSeconds(elapsed);
        if (timing && paused) {
          window.dispatchEvent(new CustomEvent('habit-timer-update', { 
            detail: { label, habitName, goalValue: value, elapsed: initialValue * 60 + elapsed, isPaused: true, habitKey } 
          }));
        }
      }
    }

    return () => {
      stopInterval();
    };
  }, [storageKey, isCompleted, startInterval, label, initialValue, habitKey, habitName, value]);

  // Save state to local storage on changes
  useEffect(() => {
    if (!isCompleted && (isTiming || elapsedSeconds > 0)) {
      localStorage.setItem(storageKey, JSON.stringify({
        start: startTimeRef.current,
        elapsed: elapsedSeconds,
        paused: isPaused,
        timing: isTiming
      }));
    } else if (isCompleted) {
      localStorage.removeItem(storageKey);
    }
  }, [isTiming, elapsedSeconds, isPaused, isCompleted, storageKey]);

  const handleStartTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    playStartSound();
    setIsTiming(true);
    setIsPaused(false);
    const now = Date.now();
    startTimeRef.current = now - (elapsedSeconds * 1000); // Adjust start time based on already elapsed seconds
    startInterval();
  };

  const handlePauseTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused) {
      playStartSound();
      setIsPaused(false);
      startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      startInterval();
    } else {
      setIsPaused(true);
      stopInterval();
      window.dispatchEvent(new CustomEvent('habit-timer-update', { 
        detail: { label, habitName, goalValue: value, elapsed: initialValue * 60 + elapsedSeconds, isPaused: true, habitKey } 
      }));
    }
  };

  // This function is now only called by the "Done" button, not by clicking the capsule itself.
  const handleFinishTiming = (mood?: string, promptMood: boolean = false) => {
    stopInterval();
    const totalSessionMinutes = Math.max(1, Math.ceil((initialValue * 60 + elapsedSeconds) / 60));
    
    if (promptMood && showMood && mood === undefined) { // Only prompt if explicitly asked AND showMood is true
      setShowMoodPicker(true);
      return;
    }

    playEndSound();
    
    if (totalSessionMinutes >= value) { // Check against capsule's value
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['hsl(var(--habit-orange))', 'hsl(var(--habit-blue))', 'hsl(var(--habit-green))', 'hsl(var(--habit-purple))', 'hsl(var(--habit-red))', 'hsl(var(--habit-indigo))']
      });
    }

    localStorage.removeItem(storageKey);
    window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
    
    onLogProgress(totalSessionMinutes, true, mood); // Pass total minutes logged for this capsule, mark as complete
    setIsTiming(false);
    setElapsedSeconds(0);
    setShowMoodPicker(false);
    setGoalReachedAlerted(false);
    startTimeRef.current = null;
  };

  const handleQuickComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) return;
    
    if (showMood) {
      setShowMoodPicker(true);
      return;
    }

    playEndSound();
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    localStorage.removeItem(storageKey);
    window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
    
    // For quick complete, log the full capsule value and mark as complete
    onLogProgress(value, true); 
  };

  const currentTotalMinutes = isTimeBased ? initialValue + (elapsedSeconds / 60) : initialValue;
  const progressPercent = Math.min(100, (currentTotalMinutes / value) * 100);

  // Use the custom habit- colors defined in globals.css and tailwind.config.ts
  const colors = {
    orange: { 
      light: 'from-habit-orange/50', dark: 'to-habit-orange', wave: 'hsl(var(--habit-orange))', 
      bg: 'bg-habit-orange', border: 'border-habit-orange-border', 
      text: 'text-habit-orange-foreground', iconBg: 'bg-habit-orange/20' 
    },
    blue: { 
      light: 'from-habit-blue/50', dark: 'to-habit-blue', wave: 'hsl(var(--habit-blue))', 
      bg: 'bg-habit-blue', border: 'border-habit-blue-border', 
      text: 'text-habit-blue-foreground', iconBg: 'bg-habit-blue/20' 
    },
    green: { 
      light: 'from-habit-green/50', dark: 'to-habit-green', wave: 'hsl(var(--habit-green))', 
      bg: 'bg-habit-green', border: 'border-habit-green-border', 
      text: 'text-habit-green-foreground', iconBg: 'bg-habit-green/20' 
    },
    purple: { 
      light: 'from-habit-purple/50', dark: 'to-habit-purple', wave: 'hsl(var(--habit-purple))', 
      bg: 'bg-habit-purple', border: 'border-habit-purple-border', 
      text: 'text-habit-purple-foreground', iconBg: 'bg-habit-purple/20' 
    },
    red: { 
      light: 'from-habit-red/50', dark: 'to-habit-red', wave: 'hsl(var(--habit-red))', 
      bg: 'bg-habit-red', border: 'border-habit-red-border', 
      text: 'text-habit-red-foreground', iconBg: 'bg-habit-red/20' 
    },
    indigo: { 
      light: 'from-habit-indigo/50', dark: 'to-habit-indigo', wave: 'hsl(var(--habit-indigo))', 
      bg: 'bg-habit-indigo', border: 'border-habit-indigo-border', 
      text: 'text-habit-indigo-foreground', iconBg: 'bg-habit-indigo/20' 
    },
  }[color];

  return (
    <motion.div layout className="relative">
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-500 border-2 rounded-[24px]",
          isCompleted 
            ? "bg-muted/30 border-muted opacity-70" 
            : cn(colors.bg, colors.border, "shadow-sm hover:shadow-md"),
          isTiming && "ring-4 ring-primary/20 shadow-xl scale-[1.01]"
        )}
        onClick={isTiming ? () => {
          const totalSessionMinutes = (initialValue * 60 + elapsedSeconds) / 60;
          if (totalSessionMinutes >= value) { // Capsule goal met by clicking card
            handleFinishTiming(undefined, false); // Marks complete, no mood prompt
          } else { // Partial progress, save and collapse
            stopInterval();
            window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
            localStorage.removeItem(storageKey);
            onLogProgress(elapsedSeconds / 60, false); // Log only the elapsed time from this session, NOT complete
            setIsTiming(false);
            setElapsedSeconds(0);
            setIsPaused(false);
            setGoalReachedAlerted(false);
            startTimeRef.current = null;
          }
        } : (!isCompleted && !showMoodPicker) ? (isTimeBased ? handleStartTimer : handleQuickComplete) : undefined}
      >
        <AnimatePresence>
          {(!isCompleted && (isTiming || initialValue > 0)) && (
            <motion.div 
              className="absolute inset-x-0 bottom-0 z-0"
              initial={{ height: "0%" }}
              animate={{ height: `${progressPercent}%` }}
              transition={{ type: "tween", ease: isTiming ? "linear" : "easeOut", duration: isTiming ? 1 : 0.6 }}
            >
              {/* Reinstated and enhanced progress fill with habit-specific gradient */}
              <div className={cn("absolute inset-0 bg-gradient-to-t", colors.light, colors.dark)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 p-4">
          {!isTiming ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-border",
                  colors.iconBg
                )}>
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-success" />
                  ) : (
                    isTimeBased ? (
                      <Play className={cn("w-5 h-5 ml-0.5 fill-current", colors.text)} />
                    ) : (
                      <span className={cn("text-base font-black", colors.text)}>{value}</span>
                    )
                  )}
                </div>
                
                <div className="min-w-0">
                  <p className={cn("font-bold text-base leading-tight truncate", isCompleted ? "text-muted-foreground" : colors.text)}>
                    {label}
                    {initialValue > 0 && !isCompleted && (
                      <span className={cn("ml-2 text-[10px] bg-black/10 dark:bg-white/20 px-1.5 py-0.5 rounded-md align-middle font-black", isCompleted ? "text-muted-foreground" : colors.text)}>+ {Math.round(initialValue)} {unit}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-xs font-bold", isCompleted ? "text-muted-foreground opacity-40" : colors.text)}>{value} {unit}</span>
                    {scheduledTime && (
                      <span className="flex items-center gap-1 text-[10px] font-bold opacity-70 bg-secondary px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        {scheduledTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isCompleted ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUncomplete();
                  }}
                >
                  <Undo2 className="w-4 h-4 mr-1" />
                  Undo
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  {isTimeBased && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 rounded-full hover:bg-secondary" 
                      onClick={handleQuickComplete}
                    >
                      <Edit2 className="w-4 h-4 opacity-40" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={cn("space-y-5 py-2", colors.text)}>
              <div className="flex justify-between items-start">
                <div className="pl-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Active {label}</p>
                  <p className="text-4xl font-black tabular-nums mt-1">{formatTime(initialValue * 60 + elapsedSeconds)}</p>
                  <p className="text-[10px] opacity-60 mt-1 font-bold">
                    Goal: {value} min {initialValue > 0 && `(incl. ${initialValue}m surplus)`}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    className="h-12 w-12 rounded-full bg-card text-foreground hover:bg-secondary shadow-md border-0"
                    onClick={handlePauseTimer}
                  >
                    {isPaused ? <Play className="w-6 h-6 ml-0.5 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                  </Button>
                  <Button 
                    size="lg" 
                    className="h-12 px-6 rounded-full font-black shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 border border-primary-foreground/20"
                    onClick={() => handleFinishTiming(undefined, true)}
                  >
                    <Square className="w-4 h-4 mr-2 fill-current" />
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showMoodPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card/95 backdrop-blur border-t border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-4 px-4 flex items-center justify-center gap-6">
                <span className="text-xs font-black uppercase tracking-wider opacity-60">Feeling?</span>
                <div className="flex gap-4">
                  <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-destructive/10" onClick={() => handleFinishTiming('sad', false)}>
                    <Frown className="w-6 h-6 text-destructive" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-warning-background/10" onClick={() => handleFinishTiming('neutral', false)}>
                    <Meh className="w-6 h-6 text-warning" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-success-background/10" onClick={() => handleFinishTiming('happy', false)}>
                    <Smile className="w-6 h-6 text-success" />
                  </Button>
                  <Button variant="ghost" size="sm" className="font-bold text-muted-foreground" onClick={() => handleFinishTiming(undefined, false)}>Skip</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};