"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, Smile, Meh, Frown, Undo2, Play, Pause, Square, RotateCcw, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { playStartSound, playEndSound, playGoalSound } from '@/utils/audio';
import { Input } from '@/components/ui/input';
import { MeasurementType } from '@/types/habit';

interface HabitCapsuleProps {
  id: string;
  habitKey: string;
  habitName: string;
  label: string;
  value: number;
  unit: string;
  measurementType: MeasurementType; // Added
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
  measurementType,
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
  const [completedTaskIdState, setCompletedTaskIdState] = useState<string | null>(initialCompletedTaskId || null);
  const [manualValue, setManualValue] = useState<number>(value);
  const [isResetting, setIsResetting] = useState(false);
  
  const ignoreClicksRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const storageKey = `timer_${habitKey}_${label}_${new Date().toISOString().split('T')[0]}`;

  useEffect(() => {
    setCompletedTaskIdState(initialCompletedTaskId || null);
  }, [initialCompletedTaskId]);

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
    if (measurementType !== 'timer') return;
    if (isCompleted) {
      localStorage.removeItem(storageKey);
      setIsTiming(false);
      setElapsedSeconds(0);
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
      }
    }
    return () => stopInterval();
  }, [isCompleted, storageKey, measurementType, startInterval]);

  const handleStartTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    playStartSound();
    setIsTiming(true);
    setIsPaused(false);
    startTimeRef.current = Date.now() - elapsedSeconds * 1000;
    startInterval();
  };

  const handlePauseTimer = (e: React.MouseEvent) => {
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
    const totalSessionMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60));
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
  };

  const handleLogManual = (mood?: string, promptMood: boolean = false) => {
    if (promptMood && showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }
    playEndSound();
    onLogProgress(manualValue, true, mood);
    setShowMoodPicker(false);
  };

  const handleLogBinary = (mood?: string, promptMood: boolean = false) => {
    if (promptMood && showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }
    playEndSound();
    onLogProgress(value, true, mood);
    setShowMoodPicker(false);
  };

  const colors = {
    orange: { light: 'from-habit-orange/60', mid: 'via-habit-orange/80', dark: 'to-habit-orange', text: 'text-habit-orange-foreground', border: 'border-habit-orange-border' },
    blue: { light: 'from-habit-blue/60', mid: 'via-habit-blue/80', dark: 'to-habit-blue', text: 'text-habit-blue-foreground', border: 'border-habit-blue-border' },
    green: { light: 'from-habit-green/60', mid: 'via-habit-green/80', dark: 'to-habit-green', text: 'text-habit-green-foreground', border: 'border-habit-green-border' },
    purple: { light: 'from-habit-purple/60', mid: 'via-habit-purple/80', dark: 'to-habit-purple', text: 'text-habit-purple-foreground', border: 'border-habit-purple-border' },
    red: { light: 'from-habit-red/60', mid: 'via-habit-red/80', dark: 'to-habit-red', text: 'text-habit-red-foreground', border: 'border-habit-red-border' },
    indigo: { light: 'from-habit-indigo/60', mid: 'via-habit-indigo/80', dark: 'to-habit-indigo', text: 'text-habit-indigo-foreground', border: 'border-habit-indigo-border' },
  }[color];

  const formatTimeDisplay = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = measurementType === 'timer' 
    ? Math.min(100, (elapsedSeconds / (value * 60)) * 100)
    : 0;

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
          {!isCompleted && measurementType === 'timer' && isTiming && (
            <motion.div
              className="absolute inset-x-0 bottom-0 z-0 pointer-events-none"
              initial={{ height: '0%' }}
              animate={{ height: `${progressPercent}%` }}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-t', colors.light, colors.mid, colors.dark)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 p-5">
          {isCompleted ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-card/80 flex items-center justify-center shrink-0 border border-border/50">
                  <Check className="w-7 h-7 text-success" />
                </div>
                <div>
                  <p className="font-bold text-lg text-muted-foreground truncate">{label}</p>
                  <p className="text-xs font-bold text-muted-foreground opacity-70">Completed</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-10 px-4 rounded-xl font-bold" onClick={() => completedTaskIdState && onUncomplete(completedTaskIdState)}>
                <Undo2 className="w-4 h-4 mr-1.5" /> Undo
              </Button>
            </div>
          ) : measurementType === 'timer' ? (
            isTiming ? (
              <div className={cn('flex flex-col sm:flex-row justify-between items-center gap-4', colors.text)}>
                <div className="pl-1">
                  <p className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none">Active • {label}</p>
                  <p className="text-4xl font-black tabular-nums mt-1 leading-none">{formatTimeDisplay(elapsedSeconds)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-card/90 shadow-md border border-border/30" onClick={handlePauseTimer}>
                    {isPaused ? <Play className="w-6 h-6 ml-0.5 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                  </Button>
                  <Button size="lg" className="h-12 px-6 rounded-full font-black shadow-lg bg-primary text-primary-foreground" onClick={() => handleFinishTiming(undefined, true)}>
                    <Square className="w-4 h-4 mr-2 fill-current" /> Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="ghost" className="w-12 h-12 rounded-2xl bg-card/95 border border-border/50" onClick={handleStartTimer}>
                    <Play className={cn('w-6 h-6 ml-0.5 fill-current', colors.text)} />
                  </Button>
                  <div>
                    <p className={cn('font-bold text-lg leading-tight', colors.text)}>{label}</p>
                    <p className="text-sm font-bold opacity-70">{value} {unit}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <p className="text-[10px] font-black uppercase opacity-40">Ready to Start</p>
                </div>
              </div>
            )
          ) : measurementType === 'unit' ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn('font-bold text-lg leading-tight', colors.text)}>{label}</p>
                  <p className="text-sm font-bold opacity-70">Goal: {value} {unit}</p>
                </div>
                <div className="flex items-center bg-card rounded-2xl p-1 border shadow-inner">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setManualValue(v => Math.max(1, v - 1))}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input 
                    type="number" 
                    value={manualValue} 
                    onChange={(e) => setManualValue(Number(e.target.value))}
                    className="w-16 h-10 border-none bg-transparent text-center font-black text-lg focus-visible:ring-0"
                  />
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setManualValue(v => v + 1)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button size="lg" className="w-full h-12 rounded-2xl font-black shadow-md bg-primary text-primary-foreground" onClick={() => handleLogManual(undefined, true)}>
                Log {manualValue} {unit}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('font-bold text-lg leading-tight', colors.text)}>{label}</p>
                <p className="text-sm font-bold opacity-70">Single session</p>
              </div>
              <Button size="lg" className="h-12 px-8 rounded-2xl font-black shadow-md bg-primary text-primary-foreground" onClick={() => handleLogBinary(undefined, true)}>
                Complete
              </Button>
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
            >
              <p className="text-sm font-black uppercase tracking-widest opacity-60">Success! How was it?</p>
              <div className="flex gap-4">
                <Button variant="ghost" className="h-14 w-14 rounded-full" onClick={() => (measurementType === 'unit' ? handleLogManual('sad', false) : measurementType === 'binary' ? handleLogBinary('sad', false) : handleFinishTiming('sad', false))}><Frown className="w-8 h-8 text-red-500" /></Button>
                <Button variant="ghost" className="h-14 w-14 rounded-full" onClick={() => (measurementType === 'unit' ? handleLogManual('neutral', false) : measurementType === 'binary' ? handleLogBinary('neutral', false) : handleFinishTiming('neutral', false))}><Meh className="w-8 h-8 text-yellow-500" /></Button>
                <Button variant="ghost" className="h-14 w-14 rounded-full" onClick={() => (measurementType === 'unit' ? handleLogManual('happy', false) : measurementType === 'binary' ? handleLogBinary('happy', false) : handleFinishTiming('happy', false))}><Smile className="w-8 h-8 text-green-500" /></Button>
              </div>
              <Button variant="link" size="sm" onClick={() => (measurementType === 'unit' ? handleLogManual(undefined, false) : measurementType === 'binary' ? handleLogBinary(undefined, false) : handleFinishTiming(undefined, false))} className="text-muted-foreground">Skip</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};