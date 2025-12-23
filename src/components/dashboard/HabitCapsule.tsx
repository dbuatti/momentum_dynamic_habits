"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, Smile, Meh, Frown, Undo2, Play, Pause, Square, RotateCcw } from 'lucide-react';
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
  completedTaskId?: string | null;
  onLogProgress: (actualValue: number, isComplete: boolean, mood?: string) => void;
  onUncomplete: (completedTaskId: string) => void;
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
  completedTaskId: initialCompletedTaskId,
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
  const [completedTaskIdState, setCompletedTaskIdState] = useState<string | null>(initialCompletedTaskId || null);
  const [isResetting, setIsResetting] = useState(false);
  
  const ignoreClicksRef = useRef(false);

  const [currentSessionInitialValue, setCurrentSessionInitialValue] = useState(initialValue);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isTimeBased = unit === 'min';
  const storageKey = `timer_${habitKey}_${label}_${new Date().toISOString().split('T')[0]}`;

  useEffect(() => {
    if (!isResetting && !ignoreClicksRef.current) {
      setCurrentSessionInitialValue(initialValue);
    }
  }, [initialValue, isResetting]);

  const formatTime = (totalSeconds: number) => {
    const rounded = Math.round(totalSeconds);
    const mins = Math.floor(rounded / 60);
    const secs = rounded % 60;
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
      }
    }, 1000);
  }, []);

  useEffect(() => {
    setCompletedTaskIdState(initialCompletedTaskId || null);
    if (isCompleted) {
      localStorage.removeItem(storageKey);
      setIsTiming(false);
      setElapsedSeconds(0);
      return;
    }
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const { start, elapsed, paused, timing, initialVal } = JSON.parse(saved);
      setIsPaused(paused);
      setIsTiming(timing);
      setCurrentSessionInitialValue(initialVal ?? initialValue);
      if (timing && !paused) {
        startTimeRef.current = start;
        setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
        startInterval();
      } else {
        setElapsedSeconds(elapsed);
      }
    }
    return () => stopInterval();
  }, [isCompleted, storageKey, initialValue, initialCompletedTaskId, startInterval]);

  const handleStartTimer = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    if (ignoreClicksRef.current || isResetting) return;
    
    playStartSound();
    setIsTiming(true);
    setIsPaused(false);
    startTimeRef.current = Date.now() - elapsedSeconds * 1000;
    startInterval();
  };

  const handleResetTimer = async (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    ignoreClicksRef.current = true;
    setIsResetting(true);
    
    stopInterval();
    localStorage.removeItem(storageKey);
    setElapsedSeconds(0);
    setCurrentSessionInitialValue(0); 
    setIsTiming(false);
    setIsPaused(false);
    setGoalReachedAlerted(false);
    startTimeRef.current = null;

    if (completedTaskIdState) {
      await onUncomplete(completedTaskIdState);
      setCompletedTaskIdState(null);
    }

    setTimeout(() => {
      ignoreClicksRef.current = false;
      setIsResetting(false);
    }, 500);
  };

  const handlePauseTimer = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    if (isPaused) {
      playStartSound();
      setIsPaused(false);
      startTimeRef.current = Date.now() - elapsedSeconds * 1000;
      startInterval();
    } else {
      setIsPaused(true);
      stopInterval();
    }
  };

  const handleFinishTiming = (mood?: string, promptMood: boolean = false) => {
    stopInterval();
    const totalSessionMinutes = Math.max(1, Math.ceil((currentSessionInitialValue * 60 + elapsedSeconds) / 60));
    if (promptMood && showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }
    playEndSound();
    localStorage.removeItem(storageKey);
    onLogProgress(totalSessionMinutes, true, mood);
    setIsTiming(false);
    setElapsedSeconds(0);
    setShowMoodPicker(false);
    setCurrentSessionInitialValue(0);
  };

  const progressPercent = Math.min(100, ((currentSessionInitialValue + elapsedSeconds / 60) / value) * 100);

  const colors = {
    orange: { light: 'from-habit-orange/60', mid: 'via-habit-orange/80', dark: 'to-habit-orange', text: 'text-habit-orange-foreground', border: 'border-habit-orange-border' },
    blue: { light: 'from-habit-blue/60', mid: 'via-habit-blue/80', dark: 'to-habit-blue', text: 'text-habit-blue-foreground', border: 'border-habit-blue-border' },
    green: { light: 'from-habit-green/60', mid: 'via-habit-green/80', dark: 'to-habit-green', text: 'text-habit-green-foreground', border: 'border-habit-green-border' },
    purple: { light: 'from-habit-purple/60', mid: 'via-habit-purple/80', dark: 'to-habit-purple', text: 'text-habit-purple-foreground', border: 'border-habit-purple-border' },
    red: { light: 'from-habit-red/60', mid: 'via-habit-red/80', dark: 'to-habit-red', text: 'text-habit-red-foreground', border: 'border-habit-red-border' },
    indigo: { light: 'from-habit-indigo/60', mid: 'via-habit-indigo/80', dark: 'to-habit-indigo', text: 'text-habit-indigo-foreground', border: 'border-habit-indigo-border' },
  }[color];

  return (
    <motion.div layout className="relative">
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-500 border-2 rounded-[28px] shadow-lg',
          isCompleted ? 'bg-muted/40 border-muted opacity-70' : cn('bg-card/80 backdrop-blur-sm', colors.border),
          isTiming && 'ring-4 ring-primary/30 shadow-2xl scale-[1.01]'
        )}
      >
        <AnimatePresence>
          {!isCompleted && (isTiming || currentSessionInitialValue > 0 || elapsedSeconds > 0) && (
            <motion.div
              className="absolute inset-x-0 bottom-0 z-0 pointer-events-none"
              initial={{ height: '0%' }}
              animate={{ height: `${progressPercent}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-t', colors.light, colors.mid, colors.dark)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 p-5">
          {!isTiming ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Button
                  size="icon"
                  variant="ghost" 
                  className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-border/50', isCompleted ? 'bg-card/80' : 'bg-card/95')}
                  onClick={handleStartTimer}
                  disabled={isCompleted}
                >
                  {isCompleted ? <Check className="w-7 h-7 text-success" /> : <Play className={cn('w-6 h-6 ml-0.5 fill-current', colors.text)} />}
                </Button>
                <div className="min-w-0">
                  <p className={cn('font-bold text-lg leading-tight truncate', isCompleted ? 'text-muted-foreground' : colors.text)}>
                    {label}
                    {currentSessionInitialValue > 0 && !isCompleted && (
                      <span className={cn('ml-2 text-[10px] bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded-md font-black', colors.text)}>
                        +{currentSessionInitialValue.toFixed(1)} {unit}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-sm font-bold opacity-70">
                    {value} {unit}
                  </div>
                </div>
              </div>
              {isCompleted && (
                <Button size="sm" variant="ghost" className="h-10 px-4 rounded-xl font-bold" onClick={(e) => { e.stopPropagation(); if (completedTaskIdState) onUncomplete(completedTaskIdState); }}>
                  <Undo2 className="w-4 h-4 mr-1.5" /> Undo
                </Button>
              )}
            </div>
          ) : (
            <div className={cn('flex flex-col sm:flex-row justify-between items-center gap-4', colors.text)}>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="pl-1">
                        <p className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none">Active • {label}</p>
                        <p className="text-4xl font-black tabular-nums mt-1 leading-none">
                            {formatTime(currentSessionInitialValue * 60 + elapsedSeconds)}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 rounded-full bg-card/90 shadow-md border border-border/30"
                    onClick={handleResetTimer}
                    disabled={isResetting}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full bg-card/90 shadow-md border border-border/30"
                    onClick={handlePauseTimer}
                    disabled={isResetting}
                  >
                    {isPaused ? <Play className="w-6 h-6 ml-0.5 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                  </Button>
                  <Button
                    size="lg"
                    className="h-12 px-6 rounded-full font-black shadow-lg bg-primary text-primary-foreground border-2 border-primary-foreground/30"
                    onClick={(e) => { e.stopPropagation(); handleFinishTiming(undefined, true); }}
                    disabled={isResetting}
                  >
                    <Square className="w-4 h-4 mr-2 fill-current" /> Done
                  </Button>
                </div>
            </div>
          )}
        </div>

        {/* Mood Picker Overlay */}
        <AnimatePresence>
          {showMoodPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-0 z-50 bg-card/95 backdrop-blur-md flex flex-col items-center justify-center p-4 gap-4"
              onClick={(e) => e.stopPropagation()}
            >
                <p className="text-sm font-black uppercase tracking-widest opacity-60">Session Complete! How was it?</p>
                <div className="flex gap-4">
                  <Button variant="ghost" className="h-14 w-14 rounded-full text-3xl" onClick={() => handleFinishTiming('sad', false)}><Frown className="w-8 h-8 text-red-500" /></Button>
                  <Button variant="ghost" className="h-14 w-14 rounded-full text-3xl" onClick={() => handleFinishTiming('neutral', false)}><Meh className="w-8 h-8 text-yellow-500" /></Button>
                  <Button variant="ghost" className="h-14 w-14 rounded-full text-3xl" onClick={() => handleFinishTiming('happy', false)}><Smile className="w-8 h-8 text-green-500" /></Button>
                </div>
                <Button variant="link" size="sm" onClick={() => handleFinishTiming(undefined, false)} className="text-muted-foreground">Skip</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};