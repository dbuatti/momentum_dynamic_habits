"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Target, Timer, PlusCircle, Loader2 } from 'lucide-react';
import { ProcessedUserHabit } from '@/types/habit';
import { HabitCapsule } from './HabitCapsule';
import { calculateDynamicChunks, calculateDailyParts } from '@/utils/progress-utils';
import { useCapsules } from '@/hooks/useCapsules';
import { useHabitLog } from '@/hooks/useHabitLog';
import { showSuccess, showError } from '@/utils/toast';
import RestTimer from '@/components/habits/RestTimer';
import { Link } from 'react-router-dom';
import { playEndSound } from '@/utils/audio';
import { Progress } from '@/components/ui/progress'; // Import Progress component

interface TodayProgressCardProps {
  habits: ProcessedUserHabit[];
  neurodivergentMode: boolean;
  isLoading: boolean;
}

export const TodayProgressCard: React.FC<TodayProgressCardProps> = ({ habits, neurodivergentMode, isLoading }) => {
  const { dbCapsules, isLoading: isLoadingCapsules, completeCapsule, uncompleteCapsule, resetCapsulesForToday } = useCapsules();
  const { mutate: logHabit, unlog: unlogHabit, isPending: isLoggingHabit } = useHabitLog(); // Destructure unlog

  const [activeTimer, setActiveTimer] = useState<{ label: string; elapsed: number; isPaused: boolean; habitKey: string; habitName: string; goalValue: number } | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(60); // Default 60 seconds

  // Memoize the processed habits with their capsules
  const habitsWithCapsules = useMemo(() => {
    if (isLoading || isLoadingCapsules) return [];

    return habits
      .filter(h => h.isScheduledForToday && h.is_visible) // Only show scheduled and visible habits
      .map(habit => {
        const { numChunks, chunkValue } = calculateDynamicChunks(
          habit.key,
          habit.adjustedDailyGoal,
          habit.unit,
          neurodivergentMode,
          habit.auto_chunking,
          habit.num_chunks,
          habit.chunk_duration
        );

        const capsules = Array.from({ length: numChunks }).map((_, index) => {
          const capsuleKey = `${habit.key}-${index}`;
          const dbCapsule = dbCapsules.find(c => c.habit_key === habit.key && c.capsule_index === index);
          
          // For the last capsule, ensure its value sums up to the adjustedDailyGoal
          const actualCapsuleValue = (index === numChunks - 1)
            ? habit.adjustedDailyGoal - (chunkValue * index)
            : chunkValue;

          return {
            id: `${habit.id}-${index}`,
            habitId: habit.id,
            habitKey: habit.key,
            habitName: habit.name,
            capsuleIndex: index,
            capsuleValue: Number(actualCapsuleValue.toFixed(1)), // Ensure it's a number
            unit: habit.unit,
            isComplete: dbCapsule?.is_completed || false,
            mood: dbCapsule?.mood || null,
            isLockedByDependency: habit.isLockedByDependency,
          };
        });
        return { ...habit, capsules };
      });
  }, [habits, neurodivergentMode, dbCapsules, isLoading, isLoadingCapsules]);

  // Calculate overall daily progress
  const { completed: totalCompletedCapsules, total: totalPossibleCapsules } = useMemo(() => {
    return calculateDailyParts(habitsWithCapsules, neurodivergentMode);
  }, [habitsWithCapsules, neurodivergentMode]);

  // Update global tab/floating timer
  useEffect(() => {
    if (activeTimer) {
      window.dispatchEvent(new CustomEvent('habit-timer-update', {
        detail: activeTimer
      }));
    } else {
      window.dispatchEvent(new CustomEvent('habit-timer-update', {
        detail: null
      }));
    }
  }, [activeTimer]);

  const handleCapsuleComplete = async (habitKey: string, capsuleIndex: number, capsuleValue: number, unit: 'min' | 'reps' | 'dose', habitName: string, mood?: string) => {
    try {
      await completeCapsule.mutateAsync({ habitKey, index: capsuleIndex, value: capsuleValue, mood });
      
      // Log to completedtasks table as well
      await logHabit({
        habitKey,
        value: unit === 'min' ? capsuleValue : Math.round(capsuleValue), // Log minutes or reps/doses
        taskName: `${habitName} (Part ${capsuleIndex + 1})`,
        note: mood ? `Mood: ${mood}` : undefined,
      });

      showSuccess(`Capsule ${capsuleIndex + 1} of ${habitName} completed!`);
      
      // If it was a time-based capsule, start rest timer
      if (unit === 'min') {
        setRestTimerDuration(neurodivergentMode ? 30 : 60); // Shorter rest for ND mode
        setShowRestTimer(true);
      }
    } catch (error) {
      showError(`Failed to complete capsule: ${error.message}`);
    }
  };

  const handleCapsuleUncomplete = async (habitKey: string, capsuleIndex: number, habitName: string) => {
    try {
      await uncompleteCapsule.mutateAsync({ habitKey, index: capsuleIndex });
      // Also unlog from completedtasks
      await unlogHabit({ // Corrected to unlogHabit
        habitKey,
        taskName: `${habitName} (Part ${capsuleIndex + 1})`,
      });
      showSuccess(`Capsule ${capsuleIndex + 1} of ${habitName} uncompleted.`);
    } catch (error) {
      showError(`Failed to uncomplete capsule: ${error.message}`);
    }
  };

  const handleStartTimer = (capsuleIndex: number, habitName: string, goalValue: number) => {
    const currentHabit = habitsWithCapsules.find(h => h.key === activeTimer?.habitKey.split('-')[0]);
    if (activeTimer && currentHabit) {
      // If another timer is active, stop it first
      playEndSound();
      setActiveTimer(null);
    }
    setActiveTimer({
      label: `${habitName} – Part ${capsuleIndex + 1}`,
      elapsed: 0,
      isPaused: false,
      habitKey: `${habitName.toLowerCase().replace(/\s/g, '_')}-${capsuleIndex}`,
      habitName: habitName,
      goalValue: goalValue,
    });
  };

  const handleStopTimer = () => {
    setActiveTimer(null);
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
    handleStopTimer(); // Corrected to call local handleStopTimer
  };

  const handleRestCancel = () => {
    setShowRestTimer(false);
    handleStopTimer(); // Corrected to call local handleStopTimer
  };

  const handleSkipRest = () => {
    setShowRestTimer(false);
    handleStopTimer(); // Corrected to call local handleStopTimer
  };

  if (isLoading || isLoadingCapsules) {
    return (
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="font-semibold text-lg flex items-center">
            <Target className="w-5 h-5 mr-2 text-primary" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-center text-muted-foreground">Loading today's habits...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-sm border-0">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="font-semibold text-lg flex items-center">
          <Target className="w-5 h-5 mr-2 text-primary" />
          Today's Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        {habitsWithCapsules.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <p className="mb-2">No habits scheduled for today or visible.</p>
            <Link to="/create-habit">
              <Button variant="outline" size="sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create a New Habit
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
              <span>Total Progress</span>
              <span>{totalCompletedCapsules}/{totalPossibleCapsules} capsules</span>
            </div>
            <Progress value={(totalCompletedCapsules / totalPossibleCapsules) * 100} className="h-2 [&>div]:bg-primary" />

            <div className="space-y-4 mt-4">
              {habitsWithCapsules.map(habit => (
                <div key={habit.id} className="space-y-2">
                  <h3 className="text-base font-bold text-foreground">{habit.name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {habit.capsules.map(capsule => (
                      <HabitCapsule
                        key={capsule.id}
                        habitId={capsule.habitId}
                        habitKey={capsule.habitKey}
                        habitName={capsule.habitName}
                        capsuleIndex={capsule.capsuleIndex}
                        capsuleValue={capsule.capsuleValue}
                        unit={capsule.unit}
                        isComplete={capsule.isComplete}
                        isLockedByDependency={capsule.isLockedByDependency}
                        onComplete={(index, mood) => handleCapsuleComplete(capsule.habitKey, index, capsule.capsuleValue, capsule.unit, capsule.habitName, mood)}
                        onUncomplete={(index) => handleCapsuleUncomplete(capsule.habitKey, index, capsule.habitName)}
                        onStartTimer={handleStartTimer}
                        onStopTimer={handleStopTimer}
                        activeTimer={activeTimer}
                        onSkipRest={handleSkipRest}
                        isNeurodivergent={neurodivergentMode}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
      {showRestTimer && (
        <RestTimer
          duration={restTimerDuration}
          onComplete={handleRestComplete}
          onCancel={handleRestCancel}
        />
      )}
    </Card>
  );
};