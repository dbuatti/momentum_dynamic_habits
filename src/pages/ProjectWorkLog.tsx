import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Loader2, Code } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';

interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  isFinished: boolean;
  startTime: number | null;
  selectedDuration: number;
}

const LOCAL_STORAGE_KEY = 'projectworkTimerState';

const ProjectWorkLog = () => {
  const location = useLocation();
  const initialDurationFromState = location.state?.duration || 60; // Default 60 min

  const [selectedDuration, setSelectedDuration] = useState<number>(initialDurationFromState);
  const initialTimeInSeconds = selectedDuration * 60;

  const { mutate: logHabit, isPending } = useHabitLog();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize state from localStorage or defaults
  const getInitialState = useCallback((): TimerState => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsedState: TimerState = JSON.parse(savedState);
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

        if (parsedState.isActive && parsedState.startTime) {
          const elapsedTime = Math.floor((Date.now() - parsedState.startTime) / 1000);
          const newTimeRemaining = parsedState.timeRemaining - elapsedTime;
          if (newTimeRemaining <= 0) {
            return { ...parsedState, timeRemaining: 0, isActive: false, isFinished: true, startTime: null };
          }
          return { ...parsedState, timeRemaining: newTimeRemaining, startTime: Date.now() };
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
        setTimerState(getInitialState());
      } else {
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
      startTime: !prevState.isActive ? Date.now() : null,
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
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleLog = () => {
    if (selectedDuration > 0) {
      logHabit({
        habitKey: 'projectwork',
        value: selectedDuration,
        taskName: 'Project Work',
      });
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const durationOptions = [30, 60, 90, 120, 180];

  return (
    <div className="flex flex-col items-center">
      <div className="text-center space-y-8 w-full max-w-xs">
        <PageHeader title="Project Work" backLink="/" />
        
        <div className="space-y-2">
          <Label htmlFor="projectwork-duration" className="text-lg font-medium text-muted-foreground">Duration (minutes)</Label>
          <Select value={String(selectedDuration)} onValueChange={(value) => setSelectedDuration(Number(value))} disabled={isActive || isPending}>
            <SelectTrigger id="projectwork-duration" className="w-full text-lg h-12">
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

        <div className="p-10 bg-card rounded-xl shadow-lg border-4 border-habit-indigo-border">
            <p className="text-6xl font-extrabold tracking-tighter">{formatTime(timeRemaining)}</p>
            <div className="flex items-center justify-center space-x-4 mt-4">
                <Button 
                    size="lg" 
                    className="w-32 h-16 rounded-full bg-habit-indigo-foreground hover:bg-habit-indigo-foreground/90"
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
            <p className="text-sm font-medium text-accent-foreground flex items-center justify-center">
                <Code className="w-4 h-4 mr-2" />
                Completion Prompt: Commit your changes and review your next step.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkLog;