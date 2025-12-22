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
  label: string;
  value: number; // Planned goal for this chunk (in minutes or reps)
  unit: string;
  isCompleted: boolean;
  initialValue?: number; // Surplus value from previous sessions (minutes)
  scheduledTime?: string;
  onComplete: (actualValue: number, mood?: string) => void;
  onUncomplete: () => void;
  color: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo';
  showMood?: boolean;
}

export const HabitCapsule: React.FC<HabitCapsuleProps> = ({
  habitKey,
  label,
  value,
  unit,
  isCompleted,
  initialValue = 0,
  scheduledTime,
  onComplete,
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
      }
    }, 1000);
  }, []);

  // Monitor for goal hit
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

  // Load state on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved && !isCompleted) {
      const { start, elapsed, paused, timing } = JSON.parse(saved);
      setIsPaused(paused);
      setIsTiming(timing);
      
      if (timing && !paused) {
        startTimeRef.current = start;
        setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
        startInterval();
      } else {
        setElapsedSeconds(elapsed);
      }
    }

    return () => stopInterval();
  }, [storageKey, isCompleted, startInterval]);

  // Save state
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

  // Visibility catch-up
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTiming && !isPaused && startTimeRef.current) {
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - startTimeRef.current) / 1000));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTiming, isPaused]);

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
      setIsPaused(false);
      startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      startInterval();
    } else {
      setIsPaused(true);
      stopInterval();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishTiming = (mood?: string) => {
    stopInterval();
    // Use Math.ceil to be generous for partial logs
    const sessionMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60));
    
    if (showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }

    playEndSound();
    
    // Only show confetti if goal was actually reached
    if ((initialValue * 60 + elapsedSeconds) / 60 >= value) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fb923c', '#60a5fa', '#4ade80', '#a78bfa', '#f87171', '#a78bfa']
      });
    }

    localStorage.removeItem(storageKey);
    onComplete(sessionMinutes, mood);
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
    const remaining = Math.max(1, value - initialValue);
    onComplete(remaining);
  };

  // Calculate percentage fill
  const currentTotalMinutes = isTiming ? initialValue + (elapsedSeconds / 60) : initialValue;
  const progressPercent = Math.min(100, (currentTotalMinutes / value) * 100);

  const colorMap = {
    orange: { 
      light: 'from-orange-300/70', dark: 'to-orange-500/90', wave: '#fb923c', 
      bg: 'bg-orange-50/40', border: 'border-orange-100/50', text: 'text-orange-600', 
      iconBg: 'bg-orange-100/60' 
    },
    blue: { 
      light: 'from-blue-300/70', dark: 'to-blue-500/90', wave: '#60a5fa', 
      bg: 'bg-blue-50/40', border: 'border-blue-100/50', text: 'text-blue-600', 
      iconBg: 'bg-blue-100/60' 
    },
    green: { 
      light: 'from-green-300/70', dark: 'to-green-500/90', wave: '#4ade80', 
      bg: 'bg-green-50/40', border: 'border-green-100/50', text: 'text-green-600', 
      iconBg: 'bg-green-100/60' 
    },
    purple: { 
      light: 'from-purple-300/70', dark: 'to-purple-500/90', wave: '#a78bfa', 
      bg: 'bg-purple-50/40', border: 'border-purple-100/50', text: 'text-purple-600', 
      iconBg: 'bg-purple-100/60' 
    },
    red: { 
      light: 'from-red-300/70', dark: 'to-red-500/90', wave: '#f87171', 
      bg: 'bg-red-50/40', border: 'border-red-100/50', text: 'text-red-600', 
      iconBg: 'bg-red-100/60' 
    },
    indigo: { 
      light: 'from-indigo-300/70', dark: 'to-indigo-500/90', wave: '#6366f1', 
      bg: 'bg-indigo-50/40', border: 'border-indigo-100/50', text: 'text-indigo-600', 
      iconBg: 'bg-indigo-100/60' 
    },
  };

  const colors = colorMap[color];

  return (
    <motion.div layout className="relative">
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-500 border-2 rounded-[24px]",
          isCompleted 
            ? "bg-muted/30 border-muted opacity-70" 
            : cn(colors.bg, colors.border, "backdrop-blur-sm shadow-sm hover:shadow-md"),
          isTiming && "ring-4 ring-primary/20 shadow-xl scale-[1.01]"
        )}
        onClick={(!isCompleted && !isTiming && !showMoodPicker) ? (isTimeBased ? handleStartTimer : handleQuickComplete) : undefined}
      >
        {/* Progress Water layer (always shows surplus, rises during timing) */}
        <AnimatePresence>
          {(!isCompleted && (isTiming || initialValue > 0)) && (
            <motion.div 
              className="absolute inset-x-0 bottom-0 z-0"
              initial={{ height: "0%" }}
              animate={{ height: `${progressPercent}%` }}
              transition={{ type: "tween", ease: isTiming ? "linear" : "easeOut", duration: isTiming ? 1 : 0.6 }}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-t", colors.light, colors.dark)} />
              {isTiming && (
                <div 
                  className="absolute inset-x-0 top-0 h-4 opacity-40" 
                  style={{ 
                    background: `linear-gradient(90deg, transparent 0%, ${colors.wave} 50%, transparent 100%)`,
                    animation: 'wave 6s linear infinite'
                  }} 
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 p-4">
          {!isTiming ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300",
                  isCompleted ? colors.iconBg : colors.iconBg
                )}>
                  {isCompleted ? (
                    <Check className={cn("w-6 h-6", colors.text)} />
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
                      <span className="ml-2 text-[10px] bg-white/40 px-1.5 py-0.5 rounded-md align-middle">+ {initialValue}m</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold opacity-60">{value} {unit}</span>
                    {scheduledTime && (
                      <span className="flex items-center gap-1 text-[10px] opacity-60 bg-white/40 px-2 py-0.5 rounded-full">
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
                  className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:bg-white/40"
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
                      className="h-10 w-10 rounded-full hover:bg-white/40" 
                      onClick={handleQuickComplete}
                    >
                      <Edit2 className="w-4 h-4 opacity-40" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5 py-2">
              <div className="flex justify-between items-start">
                <div className="pl-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Active {label}</p>
                  <p className="text-4xl font-black tabular-nums mt-1">
                    {formatTime(initialValue * 60 + elapsedSeconds)}
                  </p>
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
                    className="h-12 px-6 rounded-full font-black shadow-lg bg-gray-900 text-white hover:bg-black border border-white/20"
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

      <style>{`
        @keyframes wave {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </motion.div>
  );
};