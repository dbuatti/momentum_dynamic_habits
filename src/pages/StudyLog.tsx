import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Loader2, Check, BookOpen } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { showError } from '@/utils/toast';
import { Textarea } from '@/components/ui/textarea';

interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  isFinished: boolean;
  startTime: number | null;
  selectedDuration: number;
}

const HABIT_KEY = 'kinesiology';
const HABIT_NAME = 'Kinesiology Practice';
const DEFAULT_DURATION = 10; // Default duration set to 10 minutes
const LOCAL_STORAGE_KEY = 'kinesiologyTimerState';

const StudyLog = () => {
  const location = useLocation();
  const initialDurationFromState = location.state?.duration || DEFAULT_DURATION;
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
            return {
              ...parsedState,
              timeRemaining: 0,
              isActive: false,
              isFinished: true,
              startTime: null,
            };
          }
          
          return {
            ...parsedState,
            timeRemaining: newTimeRemaining,
            startTime: Date.now(),
          };
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

  const [timerState, setTimerState] = useState<TimerState>(getInitialState());
  const [sessionNote, setSessionNote] = useState(''); // State for optional note
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
            return {
              ...prevState,
              timeRemaining: 0,
              isActive: false,
              isFinished: true,
              startTime: null,
            };
          }
          
          return {
            ...prevState,
            timeRemaining: newTime,
          };
        });
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimerState(prevState => ({
        ...prevState,
        isActive: false,
        isFinished: true,
        startTime: null,
      }));
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
        setTimerState(getInitialState());
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
    setSessionNote(''); // Reset note on timer reset
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const durationSpentSeconds = initialTimeInSeconds - timeRemaining;
  const durationToLogMinutes = Math.floor(durationSpentSeconds / 60);

  const handleLogSession = () => {
    if (isActive) {
      showError('Please pause the timer before logging a partial session.');
      return;
    }
    
    let minutesToLog = 0;
    
    if (isFinished) {
      minutesToLog = selectedDuration;
    } else if (durationToLogMinutes > 0) {
      minutesToLog = durationToLogMinutes;
    } else if (selectedDuration > 0) {
      // Log the full selected duration, assuming manual completion if timer wasn't used
      minutesToLog = selectedDuration;
    } else {
      showError('Please select a duration to log.');
      return;
    }
    
    if (minutesToLog > 0) {
      logHabit({ 
        habitKey: HABIT_KEY, 
        value: minutesToLog, 
        taskName: HABIT_NAME,
        note: sessionNote, // Pass the note
      });
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const durationOptions = [1, 5, 10, 15, 20, 30, 45, 60];
  
  let logButtonText;
  if (isFinished) {
    logButtonText = `Log ${selectedDuration} minute session`;
  } else if (durationToLogMinutes > 0) {
    logButtonText = `Log ${durationToLogMinutes} min session`;
  } else {
    logButtonText = `Log ${selectedDuration} min session`;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 py-6">
      <div className="w-full space-y-8">
        <PageHeader title={HABIT_NAME} backLink="/" />
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="study-duration" className="text-lg font-medium text-muted-foreground">
              Duration (minutes)
            </Label>
            <Select 
              value={String(selectedDuration)} 
              onValueChange={(value) => setSelectedDuration(Number(value))}
              disabled={isActive || isPending}
            >
              <SelectTrigger id="study-duration" className="w-full text-lg h-14 rounded-2xl">
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
          
          <Card className="rounded-2xl shadow-lg border-4 border-habit-green overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col items-center">
                <div className="bg-green-50 rounded-full w-24 h-24 flex items-center justify-center mb-6">
                  <BookOpen className="w-12 h-12 text-green-500" />
                </div>
                
                <div className="p-10 bg-card rounded-full w-56 h-56 flex items-center justify-center mx-auto border-4 border-green-100">
                  <p className="text-6xl font-extrabold tracking-tighter text-habit-green">
                    {formatTime(timeRemaining)}
                  </p>
                </div>
                
                <div className="flex items-center justify-center space-x-6 mt-8">
                  <Button 
                    size="lg" 
                    className="w-36 h-16 rounded-full bg-habit-green hover:bg-habit-green/90"
                    onClick={handleToggle}
                    disabled={isFinished || isPending}
                  >
                    {isActive ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8" />
                    )}
                  </Button>
                  
                  {(isActive || isFinished || timeRemaining < initialTimeInSeconds) && (
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="w-14 h-14 rounded-full"
                      onClick={handleReset}
                      disabled={isPending}
                    >
                      <RotateCcw className="w-6 h-6" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Optional Note Field */}
        <div className="space-y-3">
          <Label htmlFor="session-note" className="text-lg font-medium text-muted-foreground">
            Optional: What did I notice?
          </Label>
          <Textarea 
            id="session-note" 
            value={sessionNote} 
            onChange={(e) => setSessionNote(e.target.value)} 
            placeholder="E.g., Felt focused for 8 minutes, struggled with balance."
            disabled={isPending}
            className="rounded-2xl"
          />
        </div>
        
        <div className="space-y-4">
          <Button 
            className="w-full bg-habit-green hover:bg-habit-green/90 text-habit-green-foreground text-lg py-6 rounded-2xl"
            onClick={handleLogSession}
            disabled={isPending || selectedDuration === 0}
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Check className="w-6 h-6 mr-2" />
                {logButtonText}
              </>
            )}
          </Button>
        </div>
        
        <div className="p-4 bg-accent rounded-md border border-border">
          <p className="text-sm font-medium text-accent-foreground flex items-center justify-center">
            <BookOpen className="w-4 h-4 mr-2" />
            Completion Prompt: Session entered. No judgment on outcome, insight, or quality.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudyLog;