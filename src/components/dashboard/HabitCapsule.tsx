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
  onComplete: (actualValue: number, mood?: string) => void;
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
  onComplete,
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

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishTiming = (mood?: string) => {
    stopInterval();
    const totalSessionMinutes = Math.max(1, Math.ceil((initialValue * 60 + elapsedSeconds) / 60));
    
    if (showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }

    playEndSound();
    
    if (totalSessionMinutes >= value) { // Check against capsule's value
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fb923c', '#60a5fa', '#4ade80', '#a78bfa', '#f87171', '#a78bfa']
      });
    }

    localStorage.removeItem(storageKey);
    window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
    
    onComplete(totalSessionMinutes, mood); // Pass total minutes logged for this capsule
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
    
    // For quick complete, log the full capsule value
    onComplete(value); 
  };

  const currentTotalMinutes = isTimeBased ? initialValue + (elapsedSeconds / 60) : initialValue;
  const progressPercent = Math.min(100, (currentTotalMinutes / value) * 100);

  // Use the custom habit- colors defined in globals.css and tailwind.config.ts
  const colors = {
    orange: { 
      light: 'from-orange-300', dark: 'to-orange-600', wave: '#fb923c', 
      bg: 'bg-habit-orange', border: 'border-habit-orange-border', 
      text: 'text-habit-orange-foreground', iconBg: 'bg-habit-orange/20' 
    },
    blue: { 
      light: 'from-blue-300', dark: 'to-blue-600', wave: '#60a5fa', 
      bg: 'bg-habit-blue', border: 'border-habit-blue-border', 
      text: 'text-habit-blue-foreground', iconBg: 'bg-habit-blue/20' 
    },
    green: { 
      light: 'from-green-300', dark: 'to-green-600', wave: '#4ade80', 
      bg: 'bg-habit-green', border: 'border-habit-green-border', 
      text: 'text-habit-green-foreground', iconBg: 'bg-habit-green/20' 
    },
    purple: { 
      light: 'from-purple-300', dark: 'to-purple-600', wave: '#a78bfa', 
      bg: 'bg-habit-purple', border: 'border-habit-purple-border', 
      text: 'text-habit-purple-foreground', iconBg: 'bg-habit-purple/20' 
    },
    red: { 
      light: 'from-red-300', dark: 'to-red-600', wave: '#f87171', 
      bg: 'bg-habit-red', border: 'border-habit-red-border', 
      text: 'text-habit-red-foreground', iconBg: 'bg-habit-red/20' 
    },
    indigo: { 
      light: 'from-indigo-300', dark: 'to-indigo-600', wave: '#6366f1', 
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
        onClick={(!isCompleted && !isTiming && !showMoodPicker) ? (isTimeBased ? handleStartTimer : handleQuickComplete) : undefined}
      >
        <AnimatePresence>
          {(!isCompleted && (isTiming || initialValue > 0)) && (
            <motion.div 
              className="absolute inset-x-0 bottom-0 z-0"
              initial={{ height: "0%" }}
              animate={{ height: `${progressPercent}%` }}
              transition={{ type: "tween", ease: isTiming ? "linear" : "easeOut", duration: isTiming ? 1 : 0.6 }}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-t", colors.light, colors.dark)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 p-4">
          {!isTiming ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-black/5",
                  colors.iconBg
                )}>
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-green-600" />
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
                      <span className="ml-2 text-[10px] bg-black/10 dark:bg-white/20 px-1.5 py-0.5 rounded-md align-middle font-black">+ {Math.round(initialValue)} {unit}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-xs font-bold", isCompleted ? "opacity-40" : "opacity-60")}>{value} {unit}</span>
                    {scheduledTime && (
                      <span className="flex items-center gap-1 text-[10px] font-bold opacity-70 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
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
                  className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:bg-black/5"
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
                      className="h-10 w-10 rounded-full hover:bg-black/5" 
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
                    className="h-12 w-12 rounded-full bg-white/90 text-black hover:bg-white shadow-md border-0"
                    onClick={handlePauseTimer}
                  >
                    {isPaused ? <Play className="w-6 h-6 ml-0.5 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                  </Button>
                  <Button 
                    size="lg" 
                    className="h-12 px-6 rounded-full font-black shadow-lg bg-black text-white hover:bg-black/90 border border-white/20"
                    onClick={() => handleFinishTiming()}
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
              className="bg-white/95 backdrop-blur border-t"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-4 px-4 flex items-center justify-center gap-6">
                <span className="text-xs font-black uppercase tracking-wider opacity-60">Feeling?</span>
                <div className="flex gap-4">
                  <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-red-50" onClick={() => handleFinishTiming('sad')}>
                    <Frown className="w-6 h-6 text-red-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-yellow-50" onClick={() => handleFinishTiming('neutral')}>
                    <Meh className="w-6 h-6 text-yellow-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-green-50" onClick={() => handleFinishTiming('happy')}>
                    <Smile className="w-6 h-6 text-green-500" />
                  </Button>
                  <Button variant="ghost" size="sm" className="font-bold text-muted-foreground" onClick={() => handleFinishTiming()}>Skip</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};