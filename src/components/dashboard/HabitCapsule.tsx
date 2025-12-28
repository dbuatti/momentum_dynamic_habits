"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, Smile, Meh, Frown, Undo2, Play, Pause, Square, RotateCcw, Plus, Minus, Lock, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedback } from '@/hooks/useFeedback';
import { Input } from '@/components/ui/input';
import { MeasurementType } from '@/types/habit';
import confetti from 'canvas-confetti';

interface HabitCapsuleProps {
  id: string;
  habitKey: string;
  habitName: string;
  label: string;
  value: number; // This is the goal/chunk value in units (min, reps, etc), now including carryover for the first chunk
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
  completeOnFinish?: boolean; // NEW PROP
  initialRemainingTimeSeconds?: number; // NEW PROP
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
  completeOnFinish = true, // Default to true
  initialRemainingTimeSeconds, // NEW PROP
}) => {
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [isTiming, setIsTiming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedTaskIdState, setCompletedTaskIdState] = useState<string | null>(initialCompletedTaskId || null);
  const [manualValue, setManualValue] = useState<number>(value);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [hasCollapsedBefore, setHasCollapsedBefore] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('has_used_collapse_gesture') === 'true';
    }
    return false;
  });
  
  const { triggerFeedback } = useFeedback();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `timer_${habitKey}_${label}_${new Date().toISOString().split('T')[0]}`;

  // Calculate the target duration in seconds for this specific capsule
  const targetDurationSeconds = measurementType === 'timer' ? Math.round(value * 60) : 0;
  // State for the actual time left, initialized with the target duration
  const [timeLeft, setTimeLeft] = useState(initialRemainingTimeSeconds !== undefined ? initialRemainingTimeSeconds : targetDurationSeconds);

  const isLoggingDisabled = isFixed && isHabitComplete && !isCompleted;
  const isBonusMode = !isFixed && isHabitComplete && !isCompleted;

  const displayUnit = unit || (measurementType === 'timer' ? 'min' : (measurementType === 'binary' ? 'dose' : 'reps'));

  useEffect(() => {
    setCompletedTaskIdState(initialCompletedTaskId || null);
  }, [initialCompletedTaskId]);

  // --- Interval Management Refactored ---
  const stopInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (measurementType !== 'timer') return;

    if (isTiming && !isPaused && !isCompleted) {
      stopInterval(); // Clear any existing interval before starting a new one
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopInterval();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      stopInterval();
    }

    // Cleanup function runs on unmount or when dependencies change
    return () => {
      stopInterval();
      window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
    };
  }, [isTiming, isPaused, isCompleted, measurementType]);
  // --------------------------------------

  // Effect to dispatch timer updates for FloatingTimer and Tab Title
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

  // Effect to handle timer completion
  useEffect(() => {
    if (isTiming && timeLeft === 0) {
      handleFinishTiming(undefined, true);
      triggerFeedback('goal_reached');
    }
  }, [timeLeft, isTiming, triggerFeedback]);

  // Effect to load/save timer state from/to localStorage (Modified to remove interval logic)
  useEffect(() => {
    if (measurementType !== 'timer') return;

    if (isCompleted) {
      localStorage.removeItem(storageKey);
      setIsTiming(false);
      setIsPaused(false);
      setTimeLeft(0); 
      return;
    }

    // Only update timeLeft from props/localStorage if timer is not actively running
    if (!isTiming) { 
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { timeLeft: savedTimeLeft, paused, timing, lastUpdated } = JSON.parse(saved);
        
        let calculatedTimeLeft = savedTimeLeft;
        if (timing && !paused && lastUpdated) {
          // Calculate actual time left based on last update to account for app being closed
          const elapsedSinceLastUpdate = Math.floor((Date.now() - lastUpdated) / 1000);
          calculatedTimeLeft = Math.max(0, savedTimeLeft - elapsedSinceLastUpdate);
        }

        setIsPaused(paused);
        setIsTiming(timing);
        setTimeLeft(calculatedTimeLeft);
        
      } else {
        // If no saved state, initialize with the prop, or default to targetDurationSeconds
        const initialTime = initialRemainingTimeSeconds !== undefined ? initialRemainingTimeSeconds : targetDurationSeconds;
        setTimeLeft(initialTime);
      }
    }
    
    // Cleanup for unmount (interval cleanup is handled by the dedicated useEffect)
    return () => {
        window.dispatchEvent(new CustomEvent('habit-timer-update', { detail: null }));
    };
  }, [isCompleted, storageKey, measurementType, targetDurationSeconds, initialRemainingTimeSeconds, isTiming]); 

  // Effect to save timer state to localStorage when active (Runs on every tick)
  useEffect(() => {
    if (measurementType === 'timer' && isTiming && !isCompleted) {
      const state = {
        timeLeft,
        paused: isPaused,
        timing: isTiming,
        lastUpdated: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [timeLeft, isPaused, isTiming, isCompleted, storageKey, measurementType]);

  // Handle Timer Actions
  const handleStartTimer = (e: React.MouseEvent) => {
    if (isLoggingDisabled) return;
    e.stopPropagation();
    triggerFeedback('start');
    
    // If starting from 0, set the time first.
    if (timeLeft <= 0) { 
      setTimeLeft(targetDurationSeconds); 
    }
    
    // Set timing state. The dedicated useEffect will start the interval on the next render.
    setIsTiming(true);
    setIsPaused(false);
  };

  const handlePauseTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerFeedback('pause');
    // Toggle isPaused. The dedicated useEffect will stop/start the interval.
    setIsPaused(prev => !prev);
  };

  const handleResetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerFeedback('pause');
    setTimeLeft(targetDurationSeconds); 
    setIsTiming(false); 
    setIsPaused(false);
    localStorage.removeItem(storageKey); 
  };

  const handleFinishTiming = (mood?: string, promptMood: boolean = false) => {
    stopInterval();
    
    let totalSessionValue = 0;
    const elapsedSecondsForThisTimerRun = targetDurationSeconds - timeLeft;

    if (measurementType === 'timer') {
      // NEW LOGIC: Use completeOnFinish toggle
      if (completeOnFinish) {
        totalSessionValue = value; 
      } else {
        totalSessionValue = Number((elapsedSecondsForThisTimerRun / 60).toFixed(2));
      }
    } else {
      const elapsedSeconds = targetDurationSeconds - timeLeft;
      totalSessionValue = Number((elapsedSeconds / 60).toFixed(2));
    }
    
    if (promptMood && showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }
    triggerFeedback('completion');
    
    if (measurementType === 'timer' && (completeOnFinish || timeLeft === 0)) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#22c55e']
      });
    }

    onLogProgress(totalSessionValue, true, mood);
    
    if (completeOnFinish) {
      setIsTiming(false);
      setTimeLeft(targetDurationSeconds); 
      localStorage.removeItem(storageKey);
      setShowMoodPicker(false);
    } else {
      // For partial logging (completeOnFinish: false)
      // Timer continues to run. `timeLeft` will be updated by the prop on re-render.
      // We need to update localStorage with the new remaining time.
      // The `useEffect` will then pick this up if the component unmounts/remounts.
      const newRemainingTime = initialRemainingTimeSeconds !== undefined ? initialRemainingTimeSeconds : targetDurationSeconds;
      localStorage.setItem(storageKey, JSON.stringify({
        timeLeft: newRemainingTime, // Store the new remaining time from the prop
        paused: isPaused,
        timing: isTiming, // Should still be true
        lastUpdated: Date.now()
      }));
      setShowMoodPicker(false);
    }
  };

  const handleCollapse = (e: React.MouseEvent) => {
    if (!isTiming || isCompleted) return;
    
    stopInterval();
    
    const elapsedSeconds = targetDurationSeconds - timeLeft; 
    const elapsedMinutes = Number((elapsedSeconds / 60).toFixed(2));

    if (measurementType === 'timer' && elapsedSeconds > 2) {
      onLogProgress(elapsedMinutes, false);
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 2000);
    }

    if (!hasCollapsedBefore) {
      setHasCollapsedBefore(true);
      localStorage.setItem('has_used_collapse_gesture', 'true');
    }

    setIsTiming(false);
    setIsPaused(false);
    localStorage.removeItem(storageKey);
    triggerFeedback('pause');
  };

  const handleLogManual = (mood?: string, promptMood: boolean = false) => {
    if (isLoggingDisabled) return;
    if (promptMood && showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }
    triggerFeedback('completion');
    
    // Manual entry usually logs exactly what is entered, but we can treat 'Complete' as full goal if requested
    const logValue = completeOnFinish ? value : manualValue;
    onLogProgress(logValue, true, mood);
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
    ? Math.min(100, ((targetDurationSeconds - timeLeft) / targetDurationSeconds) * 100)
    : 0;

  return (
    <motion.div 
      layout 
      className="relative"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card
        onClick={handleCollapse}
        className={cn(
          'relative overflow-hidden transition-all duration-700 border-2 rounded-[28px] shadow-lg',
          isCompleted ? 'bg-muted/40 border-muted opacity-70 scale-95' : cn('bg-card/80 backdrop-blur-sm', colors.border),
          isTiming && 'ring-8 ring-primary/5 shadow-2xl scale-[1.02] cursor-pointer',
          isLoggingDisabled && 'opacity-40 grayscale-[0.5]',
          isBonusMode && 'border-dashed border-success/50'
        )}
      >
        <AnimatePresence>
          {showSavedFeedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-success/20 backdrop-blur-sm flex items-center justify-center pointer-events-none"
            >
               <motion.div 
                initial={{ scale: 0.8, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="flex items-center gap-2 bg-success text-success-foreground px-4 py-2 rounded-full shadow-lg"
               >
                 <Sparkles className="w-4 h-4" />
                 <span className="text-xs font-black uppercase tracking-widest">Progress Counted</span>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {isTiming && !isPaused && (
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className={cn("absolute inset-0 pointer-events-none z-0 bg-gradient-to-br", colors.light, "to-transparent")}
          />
        )}

        <AnimatePresence>
          {!isCompleted && measurementType === 'timer' && isTiming && (
            <motion.div
              className="absolute inset-x-0 bottom-0 z-0 pointer-events-none"
              initial={{ height: '0%' }}
              animate={{ height: `${progressPercent}%` }}
              transition={{ duration: 0.8 }}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-t opacity-30', colors.light, colors.mid, colors.dark)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 p-5">
          {isCompleted ? (
            <div className="flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
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
              <div className={cn('flex flex-col gap-6', colors.text)}>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="pl-1" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center sm:items-start">
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-1">Time Remaining</span>
                        <p className="text-5xl font-black tabular-nums tracking-tighter leading-none">{formatTimeDisplay(timeLeft)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-14 w-14 rounded-full bg-card/90 shadow-xl border border-border/30 hover:scale-105 active:scale-95 transition-all" 
                        onClick={handleResetTimer}
                        title="Reset Timer"
                      >
                        <RotateCcw className="w-6 h-6 opacity-60" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-14 w-14 rounded-full bg-card/90 shadow-xl border border-border/30 hover:scale-105 active:scale-95 transition-all" 
                        onClick={handlePauseTimer}
                      >
                        {isPaused ? <Play className="w-7 h-7 ml-1 fill-current" /> : <Pause className="w-7 h-7 fill-current" />}
                      </Button>
                      <Button 
                        size="lg" 
                        className="h-14 px-8 rounded-full font-black shadow-2xl bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all" 
                        onClick={() => handleFinishTiming(undefined, true)}
                      >
                        <Square className="w-4 h-4 mr-2 fill-current" /> Complete
                      </Button>
                    </div>
                </div>
                {!hasCollapsedBefore && (
                   <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.4, y: 0 }}
                    className="flex flex-col items-center gap-2 mt-2 pointer-events-none"
                   >
                     <ChevronDown className="w-4 h-4 animate-bounce" />
                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center">
                       Tap background to save & step away
                     </p>
                   </motion.div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="ghost" className="w-12 h-12 rounded-2xl bg-card/95 border border-border/50 hover:scale-105 transition-transform" onClick={handleStartTimer}>
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
            <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
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
            <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
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

        <AnimatePresence>
          {showMoodPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 z-50 bg-card border-none flex flex-col items-center justify-center p-6 gap-6"
            >
              <div className="text-center space-y-1">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">Success!</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">How did it feel?</p>
              </div>
              <div className="flex gap-8">
                <div className="flex flex-col items-center gap-2">
                  <Button variant="ghost" className="h-16 w-16 rounded-full hover:scale-110 transition-transform bg-secondary/30" onClick={() => (measurementType === 'unit' ? handleLogManual('sad', false) : measurementType === 'binary' ? handleLogBinary('sad', false) : handleFinishTiming('sad', false))}>
                    <Frown className="w-10 h-10 text-red-500" />
                  </Button>
                  <span className="text-[10px] font-black uppercase opacity-40">Heavy</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button variant="ghost" className="h-16 w-16 rounded-full hover:scale-110 transition-transform bg-secondary/30" onClick={() => (measurementType === 'unit' ? handleLogManual('neutral', false) : measurementType === 'binary' ? handleLogBinary('neutral', false) : handleFinishTiming('neutral', false))}>
                    <Meh className="w-10 h-10 text-yellow-500" />
                  </Button>
                  <span className="text-[10px] font-black uppercase opacity-40">Neutral</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button variant="ghost" className="h-16 w-16 rounded-full hover:scale-110 transition-transform bg-secondary/30" onClick={() => (measurementType === 'unit' ? handleLogManual('happy', false) : measurementType === 'binary' ? handleLogBinary('happy', false) : handleFinishTiming('happy', false))}>
                    <Smile className="w-10 h-10 text-green-500" />
                  </Button>
                  <span className="text-[10px] font-black uppercase opacity-40">Energized</span>
                </div>
              </div>
              <Button variant="link" size="sm" onClick={() => (measurementType === 'unit' ? handleLogManual(undefined, false) : measurementType === 'binary' ? handleLogBinary(undefined, false) : handleFinishTiming(undefined, false))} className="text-muted-foreground uppercase font-black text-[10px] tracking-widest mt-2">Skip Reflection</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};