import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Loader2, Check, Sparkles } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { showError } from '@/utils/toast';

interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  isFinished: boolean;
  startTime: number | null;
}

const HABIT_KEY = 'teeth_brushing';
const FIXED_DURATION_MINUTES = 2;
const INITIAL_TIME_IN_SECONDS = FIXED_DURATION_MINUTES * 60;
const LOCAL_STORAGE_KEY = 'teethBrushingTimerState';

const TeethBrushingLog = () => {
  
  const playSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  }, []);

  // Initialize state from localStorage or defaults
  const getInitialState = useCallback((): TimerState => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsedState: TimerState & { selectedDuration?: number } = JSON.parse(savedState);
        
        // Recalculate time if timer was active when user left
        if (parsedState.isActive && parsedState.startTime) {
          const elapsedTime = Math.floor((Date.now() - parsedState.startTime) / 1000);
          const newTimeRemaining = parsedState.timeRemaining - elapsedTime;
          
          if (newTimeRemaining <= 0) {
            playSound();
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
        
        // If state exists but timer was paused/finished, return saved state
        return {
            timeRemaining: parsedState.timeRemaining,
            isActive: parsedState.isActive,
            isFinished: parsedState.isFinished,
            startTime: parsedState.startTime,
        };
      }
    }
    
    return {
      timeRemaining: INITIAL_TIME_IN_SECONDS,
      isActive: false,
      isFinished: false,
      startTime: null,
    };
  }, [playSound]);

  const [timerState, setTimerState] = useState<TimerState>(getInitialState());
  const { timeRemaining, isActive, isFinished } = timerState;
  const { mutate: logHabit, isPending } = useHabitLog();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(timerState));
    }
  }, [timerState]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState(prevState => {
          const newTime = prevState.timeRemaining - 1;
          
          if (newTime <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            playSound();
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
      playSound();
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeRemaining, playSound]);

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
      timeRemaining: INITIAL_TIME_IN_SECONDS,
      isActive: false,
      isFinished: false,
      startTime: null,
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleLog = () => {
    // Calculate duration logged in minutes (rounded down)
    const durationSpentSeconds = INITIAL_TIME_IN_SECONDS - timeRemaining;
    const durationToLogMinutes = Math.floor(durationSpentSeconds / 60);
        
    if (durationToLogMinutes > 0) {
      logHabit({ 
        habitKey: HABIT_KEY, 
        value: durationToLogMinutes, 
        taskName: 'Brush Teeth' 
      });
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
      showError('Please start the timer first.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  const isComplete = timeRemaining === 0 && isFinished;
  const durationLogged = Math.floor((INITIAL_TIME_IN_SECONDS - timeRemaining) / 60);
  
  let logButtonText;
  if (isComplete) {
    logButtonText = `Log ${FIXED_DURATION_MINUTES} minute session`;
  } else if (durationLogged > 0) {
    logButtonText = `Mark Done (${durationLogged} min logged)`;
  } else {
    logButtonText = `Mark Done`;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 py-6">
      <div className="w-full space-y-8">
        <PageHeader title="Brush Teeth" backLink="/" />
        
        <div className="space-y-6">
          <Card className="rounded-2xl shadow-lg border-4 border-blue-200 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col items-center">
                <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mb-6">
                  <Sparkles className="w-12 h-12 text-blue-500" />
                </div>
                
                <div className="p-10 bg-card rounded-full w-56 h-56 flex items-center justify-center mx-auto border-4 border-blue-100">
                  <p className="text-6xl font-extrabold tracking-tighter text-blue-500">
                    {formatTime(timeRemaining)}
                  </p>
                </div>
                
                <div className="flex items-center justify-center space-x-6 mt-8">
                  <Button 
                    size="lg" 
                    className="w-36 h-16 rounded-full bg-blue-500 hover:bg-blue-600"
                    onClick={handleToggle}
                    disabled={isFinished || isPending}
                  >
                    {isActive ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8" />
                    )}
                  </Button>
                  
                  {(isActive || isFinished || timeRemaining < INITIAL_TIME_IN_SECONDS) && (
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
        
        <div className="space-y-4">
          <Button 
            className="w-full bg-habit-green hover:bg-habit-green/90 text-habit-green-foreground text-lg py-6 rounded-2xl"
            onClick={handleLog}
            disabled={isPending || (timeRemaining === INITIAL_TIME_IN_SECONDS && !isFinished)}
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
            <Sparkles className="w-4 h-4 mr-2" />
            Completion Prompt: Brush for 2 full minutes for healthy teeth!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeethBrushingLog;