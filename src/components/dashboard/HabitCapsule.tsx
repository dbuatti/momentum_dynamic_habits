"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Timer, Check, X, Play, Pause, SkipForward, Smile, Meh, Frown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHabitLog } from '@/hooks/useHabitLog';
import { useCapsules } from '@/hooks/useCapsules';
import { playStartSound, playEndSound, playGoalSound } from '@/utils/audio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HabitCapsuleProps {
  habitId: string;
  habitKey: string;
  habitName: string;
  capsuleIndex: number;
  capsuleValue: number; // The target value for this capsule (e.g., 10 minutes, 5 reps)
  unit: 'min' | 'reps' | 'dose';
  isComplete: boolean;
  isLockedByDependency: boolean;
  onComplete: (capsuleIndex: number, mood?: string) => void;
  onUncomplete: (capsuleIndex: number) => void;
  onStartTimer: (capsuleIndex: number, habitName: string, goalValue: number) => void;
  onStopTimer: () => void;
  activeTimer: { label: string; elapsed: number; isPaused: boolean; habitKey: string } | null;
  onSkipRest: () => void;
  isNeurodivergent: boolean;
}

const moodOptions = [
  { value: 'great', icon: Smile, label: 'Great' },
  { value: 'ok', icon: Meh, label: 'Okay' },
  { value: 'struggled', icon: Frown, label: 'Struggled' },
];

export const HabitCapsule: React.FC<HabitCapsuleProps> = ({
  habitId,
  habitKey,
  habitName,
  capsuleIndex,
  capsuleValue,
  unit,
  isComplete,
  isLockedByDependency,
  onComplete,
  onUncomplete,
  onStartTimer,
  onStopTimer,
  activeTimer,
  onSkipRest,
  isNeurodivergent,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isCurrentCapsuleActive = activeTimer?.habitKey === `${habitKey}-${capsuleIndex}`;
  const isTimerRunning = isCurrentCapsuleActive && !isPaused;

  // Initialize elapsed time from activeTimer if this capsule is active
  useEffect(() => {
    if (isCurrentCapsuleActive && activeTimer) {
      setElapsedTime(activeTimer.elapsed);
      setIsPaused(activeTimer.isPaused);
    } else {
      setElapsedTime(0);
      setIsPaused(false);
    }
  }, [isCurrentCapsuleActive, activeTimer]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 1;
          // Dispatch event for FloatingTimer and TabProgress
          window.dispatchEvent(new CustomEvent('habit-timer-update', {
            detail: {
              label: `${habitName} – Part ${capsuleIndex + 1}`,
              elapsed: newTime,
              isPaused: false,
              habitKey: `${habitKey}-${capsuleIndex}`,
              habitName: habitName,
              goalValue: capsuleValue,
            }
          }));

          // Play goal sound if a significant milestone is reached (e.g., every 5 minutes)
          if (unit === 'min' && newTime > 0 && newTime % (5 * 60) === 0) {
            playGoalSound();
          }

          return newTime;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTimerRunning, habitKey, capsuleIndex, habitName, capsuleValue, unit]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPauseToggle = () => {
    if (isCurrentCapsuleActive) {
      const newPausedState = !isPaused;
      setIsPaused(newPausedState);
      // Update global timer state
      window.dispatchEvent(new CustomEvent('habit-timer-update', {
        detail: {
          label: `${habitName} – Part ${capsuleIndex + 1}`,
          elapsed: elapsedTime,
          isPaused: newPausedState,
          habitKey: `${habitKey}-${capsuleIndex}`,
          habitName: habitName,
          goalValue: capsuleValue,
        }
      }));
      if (!newPausedState) {
        playStartSound(); // Play sound when resuming
      }
    } else {
      // Start a new timer for this capsule
      playStartSound();
      onStartTimer(capsuleIndex, habitName, capsuleValue);
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    playEndSound();
    onStopTimer();
    setElapsedTime(0);
    setIsPaused(false);
    setShowMoodPicker(true); // Show mood picker on stop
  };

  const handleMoodSelect = (mood: string) => {
    onComplete(capsuleIndex, mood);
    setShowMoodPicker(false);
  };

  const progressPercentage = unit === 'min' 
    ? Math.min(100, (elapsedTime / (capsuleValue * 60)) * 100)
    : Math.min(100, (elapsedTime / capsuleValue) * 100); // For reps/doses, assume elapsed is reps/doses

  const displayValue = unit === 'min' ? `${capsuleValue} min` : `${capsuleValue} ${unit}`;
  const displayProgress = unit === 'min' ? formatTime(elapsedTime) : `${elapsedTime} ${unit}`;

  if (showMoodPicker) {
    return (
      <Card className="rounded-2xl border-2 border-primary/20 bg-card shadow-sm p-4 flex flex-col items-center justify-center space-y-4">
        <p className="text-sm font-semibold text-foreground">How did this capsule feel?</p>
        <div className="flex gap-3">
          {moodOptions.map(option => (
            <Button
              key={option.value}
              variant="outline"
              size="icon"
              className="w-14 h-14 rounded-xl flex flex-col gap-1 text-xs"
              onClick={() => handleMoodSelect(option.value)}
            >
              <option.icon className="w-6 h-6" />
              <span>{option.label}</span>
            </Button>
          ))}
        </div>
        <Button variant="ghost" onClick={() => setShowMoodPicker(false)} className="text-muted-foreground text-xs">
          Skip Mood
        </Button>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "rounded-2xl border-2 transition-all duration-200",
      isComplete ? "border-success-border bg-success-background/30" : "border-border bg-card",
      isLockedByDependency && "opacity-50 pointer-events-none"
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isComplete ? "bg-success text-success-foreground" : "bg-primary/10 text-primary"
            )}>
              {isComplete ? <Check className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
            </div>
            <p className="font-semibold text-sm">{habitName} <span className="text-muted-foreground">Part {capsuleIndex + 1}</span></p>
          </div>
          {isComplete ? (
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => onUncomplete(capsuleIndex)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full"
                    onClick={handleStartPauseToggle}
                    disabled={isLockedByDependency}
                  >
                    {isCurrentCapsuleActive && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                {isLockedByDependency && (
                  <TooltipContent>
                    Complete prerequisite habit first.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Goal: {displayValue}</span>
            <span>Progress: {isCurrentCapsuleActive ? displayProgress : '00:00'}</span>
          </div>
          <Progress value={progressPercentage} className="h-2 [&>div]:bg-primary" />
        </div>

        {isCurrentCapsuleActive && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" className="h-8 rounded-xl" onClick={handleStop}>
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
            {unit === 'min' && ( // Only show skip rest for time-based habits
              <Button variant="outline" size="sm" className="h-8 rounded-xl" onClick={onSkipRest}>
                <SkipForward className="w-4 h-4 mr-2" />
                Skip Rest
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};