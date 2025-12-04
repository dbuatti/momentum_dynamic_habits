import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  isFinished: boolean;
  startTime: number | null; // Timestamp when timer was last started/resumed (Date.now())
  selectedDuration: number; // The duration chosen by the user in minutes
}

const LOCAL_STORAGE_KEY = 'kinesiologyTimerState';

const StudyLog = () => {
  const location = useLocation();
  const initialDurationFromState = location.state?.duration || 1; // Default from dashboard or 1 min

  const [selectedDuration, setSelectedDuration] = useState<number>(initialDurationFromState);
  const initialTimeInSeconds = selectedDuration * 60;

  // Initialize state from localStorage or defaults
  const getInitialState = useCallback((): TimerState => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsedState: TimerState = JSON.parse(savedState);
        // If the saved state is for a different initial duration, reset it
        if (parsedState.selectedDuration !== selectedDuration) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          return {
            timeRemaining: initialTimeInSeconds,
            isActive: false,
            isFinished: false,
            startTime: null,
            selectedDuration: selectedDuration,
          };
        }

        // Recalculate time if timer was active when user left
        if (parsedState.isActive && parsedState.startTime) {
          const elapsedTime = Math.floor((Date.now() - parsedState.startTime) / 1000);
          const newTimeRemaining = parsedState.timeRemaining - elapsedTime;
          if (newTimeRemaining <= 0) {
            return { ...parsedState, timeRemaining: 0, isActive: false, isFinished: true, startTime: null };
          }
          return { ...parsedState, timeRemaining: newTimeRemaining, startTime: Date.now() }; // Update startTime to now for accurate resume
        }
        return parsedState;
      }
    }
    return {
      timeRemaining: initialTimeInSeconds,
      isActive: false,
      isFinished: false,
      startTime: null,
      selectedDuration: selectedDuration,
    };
  }, [selectedDuration, initialTimeInSeconds]);

  const [timerState, setTimerState] = useState<TimerState>(getInitialState);
  const { timeRemaining, isActive, isFinished } = timerState;

  const { mutate: logHabit, isPending } = useHabitLog();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(timerState));
    }
  }, [timerState]);

  // Reset timer state if selectedDuration changes
  useEffect(() => {
    handleReset();
  }, [selectedDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState(prevState => {
          const newTime = prevState.timeRemaining - 1;
          if (newTime <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return { ...prevState, timeRemaining: 0, isActive: false, isFinished: true, startTime: null };
          }
          return { ...prevState, timeRemaining: newTime };
        });
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimerState(prevState => ({ ...prevState, isActive: false, isFinished: true, startTime: null }));
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeRemaining]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Recalculate time when tab becomes active
        setTimerState(getInitialState()); // Re-initialize to recalculate based on current time
      } else {
        // Clear interval when tab is hidden to prevent throttling issues
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getInitialState]);

  const handleToggle = () => {
    if (isFinished) return;
    setTimerState(prevState => ({
      ...prevState,
      isActive: !prevState.isActive,
      startTime: !prevState.isActive ? Date.now() : null, // Record start time when activating
    }));
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState({
      timeRemaining: selectedDuration * 60,
      isActive: false,
      isFinished: false,
      startTime: null,
      selectedDuration: selectedDuration,
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear from localStorage
  };

  const handleLog = () => {
    if (selectedDuration > 0) {
      logHabit({
        habitKey: 'kinesiology',
        value: selectedDuration,
        taskName: 'Kinesiology Study',
      });
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear from localStorage after logging
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const durationOptions = [1, 5, 10, 15, 20, 30, 45, 60];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-center space-y-8 w-full max-w-xs">
        <h1 className="text-4xl font-bold text-habit-green-foreground">Kinesiology Study</h1>
        
        <div className="space-y-2">
          <Label htmlFor="study-duration" className="text-lg font-medium text-muted-foreground">Duration (minutes)</Label>
          <Select value={String(selectedDuration)} onValueChange={(value) => setSelectedDuration(Number(value))} disabled={isActive || isPending}>
            <SelectTrigger id="study-duration" className="w-full text-lg h-12">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map(option => (
                <SelectItem key={option} value={String(option)}>
                  {option} minutes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-10 bg-card rounded-xl shadow-lg border-4 border-habit-green-border">
            <p className="text-6xl font-extrabold tracking-tighter">{formatTime(timeRemaining)}</p>
            <div className="flex items-center justify-center space-x-4 mt-4">
                <Button 
                    size="lg" 
                    className="w-32 h-16 rounded-full bg-habit-green-foreground hover:bg-habit-green-foreground/90"
                    onClick={handleToggle}
                    disabled={isFinished || isPending}
                >
                    {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </Button>
                {(isActive || isFinished) && (
                    <Button size="icon" variant="outline" onClick={handleReset} disabled={isPending}>
                        <RotateCcw className="w-6 h-6" />
                    </Button>
                )}
            </div>
        </div>

        {isFinished && (
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 text-lg py-6" 
            onClick={handleLog} 
            disabled={isPending}
          >
            {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : `Log ${selectedDuration} minute session`}
          </Button>
        )}
        <div className="p-3 bg-accent rounded-md border border-border">
            <p className="text-sm font-medium text-accent-foreground">
                Completion Prompt: Space built. You showed up! Now, look at one piece of paper before you leave the area.
            </p>
        </div>
      </div>
    </div>
  );
};

export default StudyLog;