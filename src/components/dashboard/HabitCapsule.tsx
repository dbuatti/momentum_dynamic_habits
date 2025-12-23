"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, Smile, Meh, Frown, Undo2, Play, Pause, Square, Edit2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playStartSound, playEndSound, playGoalSound } from '@/utils/audio';

interface HabitCapsuleProps {
  id: string;
  habitKey: string;
  habitName: string;
  label: string;
  value: number;
  unit: string;
  isCompleted: boolean;
  initialValue?: number;
  scheduledTime?: string;
  onLogProgress: (actualValue: number, isComplete: boolean, mood?: string) => void;
  onUncomplete: () => void;
  color: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo';
  showMood?: boolean;
}

export const HabitCapsule: React.FC<HabitCapsuleProps> = ({
  habitKey,
  habitName,
  label,
  value,
  unit,
  isCompleted,
  initialValue = 0,
  scheduledTime,
  onLogProgress,
  onUncomplete,
  color,
  showMood,
}) => {
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [isTiming, setIsTiming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [goalReachedAlerted, setGoalReachedAlerted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isTimeBased = unit === 'min';
  
  const storageKey = `timer_${habitKey}_${label}_${new Date().toISOString().split('T')[0]}`;

  const formatTime = (totalSeconds: number) => {
    const roundedTotalSeconds = Math.round(totalSeconds); // Round the total seconds first
    const mins = Math.floor(roundedTotalSeconds / 60);
    const secs = roundedTotalSeconds % 60;
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
        
        window.dispatchEvent(new CustomEvent('habit-timer-update', { 
          detail: { 
            label, 
            habitName,
            goalValue: value,
            elapsed: initialValue * 60 + totalElapsed,
            isPaused: false,
            habitKey 
          } 
        }));
      }
    }, 1000);
  }, [label, initialValue, habitKey, habitName, value]);

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

    return () => stopInterval();
  }, [storageKey, isCompleted, startInterval, label, initialValue, habitKey, habitName, value]);

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
    startTimeRef.current = now - (elapsedSeconds * 1000);
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

  // New: Reset timer function
  const handleResetTimer = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event propagation
    stopInterval();
    setElapsedSeconds(0);
    setIsTiming(false);
    setIsPaused(false);
    setGoalReachedAlerted(false);
    startTimeRef.current = null;
    localStorage.removeItem(storageKey);
    window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
    onLogProgress(0, false); // Notify parent to reset progress
  };

  const handleFinishTiming = (mood?: string, promptMood: boolean = false) => {
    stopInterval();
    const totalSessionMinutes = Math.max(1, Math.ceil((initialValue * 60 + elapsedSeconds) / 60));
    
    if (promptMood && showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }

    playEndSound();
    
    if (totalSessionMinutes >= value) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['hsl(var(--habit-orange))', 'hsl(var(--habit-blue))', 'hsl(var(--habit-green))', 'hsl(var(--habit-purple))', 'hsl(var(--habit-red))', 'hsl(var(--habit-indigo))']
      });
    }

    localStorage.removeItem(storageKey);
    window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
    
    onLogProgress(totalSessionMinutes, true, mood);
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
    
    onLogProgress(value, true);
  };

  const currentTotalMinutes = isTimeBased ? initialValue + (elapsedSeconds / 60) : initialValue;
  const progressPercent = Math.min(100, (currentTotalMinutes / value) * 100);

  const colors = {
    orange: { 
      light: 'from-habit-orange/60', // Adjusted opacity
      mid: 'via-habit-orange/80',    // Adjusted opacity
      dark: 'to-habit-orange', 
      wave: 'hsl(var(--habit-orange))', 
      bg: 'bg-habit-orange', 
      border: 'border-habit-orange-border', 
      text: 'text-habit-orange-foreground', 
      iconBg: 'bg-habit-orange/20' 
    },
    blue: { 
      light: 'from-habit-blue/60', 
      mid: 'via-habit-blue/80', 
      dark: 'to-habit-blue', 
      wave: 'hsl(var(--habit-blue))', 
      bg: 'bg-habit-blue', 
      border: 'border-habit-blue-border', 
      text: 'text-habit-blue-foreground', 
      iconBg: 'bg-habit-blue/20' 
    },
    green: { 
      light: 'from-habit-green/60', 
      mid: 'via-habit-green/80', 
      dark: 'to-habit-green', 
      wave: 'hsl(var(--habit-green))', 
      bg: 'bg-habit-green', 
      border: 'border-habit-green-border', 
      text: 'text-habit-green-foreground', 
      iconBg: 'bg-habit-green/20' 
    },
    purple: { 
      light: 'from-habit-purple/60', 
      mid: 'via-habit-purple/80', 
      dark: 'to-habit-purple', 
      wave: 'hsl(var(--habit-purple))', 
      bg: 'bg-habit-purple', 
      border: 'border-habit-purple-border', 
      text: 'text-habit-purple-foreground', 
      iconBg: 'bg-habit-purple/20' 
    },
    red: { 
      light: 'from-habit-red/60', 
      mid: 'via-habit-red/80', 
      dark: 'to-habit-red', 
      wave: 'hsl(var(--habit-red))', 
      bg: 'bg-habit-red', 
      border: 'border-habit-red-border', 
      text: 'text-habit-red-foreground', 
      iconBg: 'bg-habit-red/20' 
    },
    indigo: { 
      light: 'from-habit-indigo/60', 
      mid: 'via-habit-indigo/80', 
      dark: 'to-habit-indigo', 
      wave: 'hsl(var(--habit-indigo))', 
      bg: 'bg-habit-indigo', 
      border: 'border-habit-indigo-border', 
      text: 'text-habit-indigo-foreground', 
      iconBg: 'bg-habit-indigo/20' 
    },
  }[color];

  return (
    <motion.div layout className="relative">
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-500 border-2 rounded-[28px] shadow-lg",
          isCompleted 
            ? "bg-muted/40 border-muted opacity-70" 
            : cn("bg-card/80 backdrop-blur-sm", colors.border, "hover:shadow-xl"),
          isTiming && "ring-4 ring-primary/30 shadow-2xl scale-[1.02]"
        )}
        onClick={isTiming ? () => {
          const totalSessionMinutes = (initialValue * 60 + elapsedSeconds) / 60;
          if (totalSessionMinutes >= value) {
            handleFinishTiming(undefined, false);
          } else {
            stopInterval();
            window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
            localStorage.removeItem(storageKey);
            onLogProgress(elapsedSeconds / 60, false);
            setIsTiming(false);
            setElapsedSeconds(0);
            setIsPaused(false);
            setGoalReachedAlerted(false);
            startTimeRef.current = null;
          }
        } : (!isCompleted && !showMoodPicker) ? (isTimeBased ? handleStartTimer : handleQuickComplete) : undefined}
      >
        {/* Enhanced liquid fill with multi-stop gradient + subtle wave effect */}
        <AnimatePresence>
          {(!isCompleted && (isTiming || initialValue > 0 || elapsedSeconds > 0)) && (
            <motion.div 
              className="absolute inset-x-0 bottom-0 z-0 pointer-events-none"
              initial={{ height: "0%" }}
              animate={{ height: `${progressPercent}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-t", colors.light, colors.mid, colors.dark, "shadow-inner-lg")} /> {/* Added shadow-inner-lg */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className={cn("absolute inset-x-0 h-16 opacity-40")}
                  animate={{ y: ["0%", "-50%", "0%"], x: ["-10%", "10%", "-10%"] }} // More organic wave motion
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  style={{ 
                    background: `linear-gradient(to right, transparent, ${colors.wave}33, transparent)`, // Use wave color with opacity
                    transform: "translateY(4px) rotate(2deg)" 
                  }}
                />
                <motion.div
                  className={cn("absolute inset-x-0 h-16 opacity-30")}
                  animate={{ y: ["-50%", "0%", "-50%"], x: ["10%", "-10%", "10%"] }} // More organic wave motion
                  transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                  style={{ 
                    background: `linear-gradient(to right, transparent, ${colors.wave}22, transparent)`, // Use wave color with opacity
                    transform: "translateY(-2px) rotate(-1deg)" 
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 p-5">
          {!isTiming ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md border border-border/50 backdrop-blur",
                  isCompleted ? "bg-card/80" : "bg-card/95"
                )}>
                  {isCompleted ? (
                    <Check className="w-7 h-7 text-success" />
                  ) : (
                    isTimeBased ? (
                      <Play className={cn("w-6 h-6 ml-0.5 fill-current", colors.text)} />
                    ) : (
                      <span className={cn("text-xl font-black", colors.text)}>{value}</span>
                    )
                  )}
                </div>
                
                <div className="min-w-0">
                  <p className={cn("font-bold text-lg leading-tight truncate", isCompleted ? "text-muted-foreground" : colors.text)}>
                    {label}
                    {initialValue > 0 && !isCompleted && (
                      <span className={cn("ml-2 text-xs bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded-md font-black", colors.text)}>
                        +{initialValue.toFixed(1)} {unit}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("text-sm font-bold", isCompleted ? "text-muted-foreground" : colors.text)}>
                      {value} {unit}
                    </span>
                    {scheduledTime && (
                      <span className="flex items-center gap-1 text-xs font-bold opacity-70 bg-secondary/70 px-2.5 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5" />
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
                  className="h-10 px-4 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUncomplete();
                  }}
                >
                  <Undo2 className="w-4 h-4 mr-1.5" />
                  Undo
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  {isTimeBased && (
                    <>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-11 w-11 rounded-full hover:bg-secondary/70" 
                        onClick={handleQuickComplete}
                      >
                        <Edit2 className="w-5 h-5 opacity-50" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={cn("space-y-6 py-3", colors.text)}>
              <div className="flex justify-between items-start">
                <div className="pl-1">
                  <p className="text-xs font-black uppercase tracking-widest opacity-60">Active • {label}</p>
                  <p className="text-5xl font-black tabular-nums mt-2">{formatTime(initialValue * 60 + elapsedSeconds)}</p>
                  <p className="text-xs opacity-60 mt-2 font-bold">
                    Goal: {value} min {initialValue > 0 && `(incl. +${initialValue.toFixed(1)}m)`}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  {/* Reset button added here */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-14 w-14 rounded-full bg-card/90 text-foreground/70 hover:text-foreground hover:bg-secondary/80 shadow-lg border border-border/30"
                    onClick={handleResetTimer}
                  >
                    <RotateCcw className="w-6 h-6" />
                  </Button>

                  <Button 
                    size="icon" 
                    className="h-14 w-14 rounded-full bg-card/90 text-foreground hover:bg-secondary shadow-lg border border-border/30"
                    onClick={handlePauseTimer}
                  >
                    {isPaused ? <Play className="w-7 h-7 ml-0.5 fill-current" /> : <Pause className="w-7 h-7 fill-current" />}
                  </Button>
                  <Button 
                    size="lg" 
                    className="h-14 px-8 rounded-full font-black shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary-foreground/30"
                    onClick={() => handleFinishTiming(undefined, true)}
                  >
                    <Square className="w-5 h-5 mr-2 fill-current" />
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
              className="bg-card/95 backdrop-blur-md border-t-2 border-border/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-5 px-6 flex items-center justify-center gap-8">
                <span className="text-sm font-black uppercase tracking-wider opacity-60">How do you feel?</span>
                <div className="flex gap-6">
                  <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full hover:bg-destructive/10" onClick={() => handleFinishTiming('sad', false)}>
                    <Frown className="w-7 h-7 text-destructive" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full hover:bg-muted" onClick={() => handleFinishTiming('neutral', false)}>
                    <Meh className="w-7 h-7 text-muted-foreground" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full hover:bg-success/10" onClick={() => handleFinishTiming('happy', false)}>
                    <Smile className="w-7 h-7 text-success" />
                  </Button>
                  <Button variant="ghost" size="sm" className="font-bold text-muted-foreground px-4" onClick={() => handleFinishTiming(undefined, false)}>
                    Skip
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};