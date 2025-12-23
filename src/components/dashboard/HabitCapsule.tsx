"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, Smile, Meh, Frown, Undo2, Play, Pause, Square, RotateCcw, Plus, Minus, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedback } from '@/hooks/useFeedback';
import { Input } from '@/components/ui/input';
import { MeasurementType } from '@/types/habit';

interface HabitCapsuleProps {
  id: string;
  habitKey: string;
  habitName: string;
  label: string;
  value: number;
  unit: string;
  measurementType: MeasurementType;
  isCompleted: boolean;
  isHabitComplete?: boolean; 
  isFixed?: boolean; 
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
  isHabitComplete = false,
  isFixed = false,
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
  const [timeLeft, setTimeLeft] = useState(measurementType === 'timer' ? value * 60 : 0);
  const [isPaused, setIsPaused] = useState(false);
  const [completedTaskIdState, setCompletedTaskIdState] = useState<string | null>(initialCompletedTaskId || null);
  const [manualValue, setManualValue] = useState<number>(value);
  
  const { triggerFeedback } = useFeedback();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `timer_${habitKey}_${label}_${new Date().toISOString().split('T')[0]}`;

  const isLoggingDisabled = isFixed && isHabitComplete && !isCompleted;
  const isBonusMode = !isFixed && isHabitComplete && !isCompleted;

  // Defensive Unit Fallback for rendering
  const displayUnit = unit || (measurementType === 'timer' ? 'min' : (measurementType === 'binary' ? 'dose' : 'reps'));

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
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopInterval();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (measurementType === 'timer' && isTiming) {
      window.dispatchEvent(new CustomEvent('habit-timer-update', {
        detail: {
          label,
          remaining: timeLeft, 
          isPaused,
          habitKey,
          habitName,
          goalValue: value
        }
      }));
    } else if (measurementType === 'timer' && !isTiming) {
      window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
    }
  }, [timeLeft, isTiming, isPaused, label, value, habitKey, habitName, measurementType]);

  useEffect(() => {
    if (isTiming && timeLeft === 0) {
      handleFinishTiming(undefined, true);
      triggerFeedback('goal_reached');
    }
  }, [timeLeft, isTiming, triggerFeedback]);

  useEffect(() => {
    if (measurementType !== 'timer') return;
    if (isCompleted) {
      localStorage.removeItem(storageKey);
      setIsTiming(false);
      setTimeLeft(value * 60);
      return;
    }
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const { timeLeft: savedTimeLeft, paused, timing } = JSON.parse(saved);
      setIsPaused(paused);
      setIsTiming(timing);
      setTimeLeft(savedTimeLeft);
      if (timing && !paused) {
        startInterval();
      }
    } else {
      setTimeLeft(value * 60);
    }
    return () => {
        stopInterval();
        window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
    };
  }, [isCompleted, storageKey, measurementType, startInterval, value]);

  useEffect(() => {
    if (measurementType === 'timer' && isTiming && !isCompleted) {
      localStorage.setItem(storageKey, JSON.stringify({
        timeLeft,
        paused: isPaused,
        timing: isTiming,
        lastUpdated: Date.now()
      }));
    }
  }, [timeLeft, isPaused, isTiming, isCompleted, storageKey, measurementType]);

  const handleStartTimer = (e: React.MouseEvent) => {
    if (isLoggingDisabled) return;
    e.stopPropagation();
    triggerFeedback('start');
    setIsTiming(true);
    setIsPaused(false);
    if (timeLeft <= 0) setTimeLeft(value * 60);
    startInterval();
  };

  const handlePauseTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerFeedback('pause');
    if (isPaused) {
      setIsPaused(false);
      startInterval();
    } else {
      setIsPaused(true);
      stopInterval();
    }
  };

  const handleResetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerFeedback('pause');
    setTimeLeft(value * 60);
    // Reset back to starting position without pausing if it was timing
  };

  const handleFinishTiming = (mood?: string, promptMood: boolean = false) => {
    stopInterval();
    const totalSessionMinutes = timeLeft === 0 ? value : Math.max(1, Math.ceil((value * 60 - timeLeft) / 60));
    
    if (promptMood && showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }
    triggerFeedback('completion');
    localStorage.removeItem(storageKey);
    onLogProgress(totalSessionMinutes, true, mood);
    setIsTiming(false);
    setTimeLeft(value * 60);
    setShowMoodPicker(false);
  };

  const handleLogManual = (mood?: string, promptMood: boolean = false) => {
    if (isLoggingDisabled) return;
    if (promptMood && showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }
    triggerFeedback('completion');
    onLogProgress(manualValue, true, mood);
    setShowMoodPicker(false);
  };

  const handleLogBinary = (mood?: string, promptMood: boolean = false) => {
    if (isLoggingDisabled) return;
    if (promptMood && showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }
    triggerFeedback('completion');
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
    ? Math.min(100, ((value * 60 - timeLeft) / (value * 60)) * 100)
    : 0;

  return (
    <motion.div layout className="relative">
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-500 border-2 rounded-[28px] shadow-lg',
          isCompleted ? 'bg-muted/40 border-muted opacity-70' : cn('bg-card/80 backdrop-blur-sm', colors.border),
          isTiming && 'ring-4 ring-primary/30 shadow-2xl scale-[1.01]',
          isLoggingDisabled && 'opacity-40 grayscale-[0.5]',
          isBonusMode && 'border-dashed border-success/50'
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
          ) : isLoggingDisabled ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-bold text-lg text-muted-foreground">{label}</p>
                  <p className="text-xs font-bold text-muted-foreground opacity-70">Daily limit reached</p>
                </div>
              </div>
            </div>
          ) : measurementType === 'timer' ? (
            isTiming ? (
              <div className={cn('flex flex-col sm:flex-row justify-between items-center gap-4', colors.text)}>
                <div className="pl-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-black uppercase opacity-60 tracking-widest leading-none">Remaining:</span>
                    <p className="text-4xl font-black tabular-nums leading-none">{formatTimeDisplay(timeLeft)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-12 w-12 rounded-full bg-card/90 shadow-md border border-border/30" 
                    onClick={handleResetTimer}
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full bg-card/90 shadow-md border border-border/30" onClick={handlePauseTimer}>
                    {isPaused ? <Play className="w-6 h-6 ml-0.5 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                  </Button>
                  <Button size="lg" className="h-12 px-6 rounded-full font-black shadow-lg bg-primary text-primary-foreground" onClick={() => handleFinishTiming(undefined, true)}>
                    <Square className="w-4 h-4 mr-2 fill-current" /> Finish Early
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
                    <p className={cn('font-bold text-lg leading-tight', colors.text)}>
                      {isBonusMode ? 'Log More?' : label}
                    </p>
                    <p className="text-sm font-bold opacity-70">
                      {isBonusMode ? `Bonus ${displayUnit}` : `${value} ${displayUnit} Goal`}
                    </p>
                  </div>
                </div>
                {isBonusMode && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success border border-success/20">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase">Goal Met!</span>
                  </div>
                )}
              </div>
            )
          ) : measurementType === 'unit' ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn('font-bold text-lg leading-tight', colors.text)}>
                    {isBonusMode ? 'Bonus Reps' : label}
                  </p>
                  <p className="text-sm font-bold opacity-70">
                    {isBonusMode ? 'Goal already met!' : `Goal: ${value} ${displayUnit}`}
                  </p>
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
              <Button 
                size="lg" 
                className={cn(
                  "w-full h-12 rounded-2xl font-black shadow-md",
                  isBonusMode ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
                )} 
                onClick={() => handleLogManual(undefined, true)}
              >
                Log {manualValue} {displayUnit} {isBonusMode && 'Extra'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('font-bold text-lg leading-tight', colors.text)}>
                  {isBonusMode ? 'Log More?' : label}
                </p>
                <p className="text-sm font-bold opacity-70">
                  {isBonusMode ? 'Exceeding target' : 'Single session'}
                </p>
              </div>
              <Button 
                size="lg" 
                className={cn(
                  "h-12 px-8 rounded-2xl font-black shadow-md",
                  isBonusMode ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
                )} 
                onClick={() => handleLogBinary(undefined, true)}
              >
                {isBonusMode ? 'Log Extra' : 'Complete'}
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