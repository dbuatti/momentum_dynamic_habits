import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, RotateCcw, Loader2, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useHabitLog } from '@/hooks/useHabitLog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  isFinished: boolean;
  startTime: number | null;
  selectedDuration: number;
  completedSongs: string[];
}

const LOCAL_STORAGE_KEY = 'pianoTimerState';

const PianoLog = () => {
  const location = useLocation();
  const initialDurationFromState = location.state?.duration || 1; // Default from dashboard or 1 min
  const [selectedDuration, setSelectedDuration] = useState<number>(initialDurationFromState);
  const initialTimeInSeconds = selectedDuration * 60;
  const targetSongs = ["Song A", "Song B", "Song C", "Song D", "Song E"];

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
            completedSongs: [],
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
      completedSongs: [],
    };
  }, [selectedDuration, initialTimeInSeconds]);

  const [timerState, setTimerState] = useState<TimerState>(getInitialState());
  const { timeRemaining, isActive, isFinished, completedSongs } = timerState;
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
      completedSongs: [],
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleLog = () => {
    if (selectedDuration > 0) {
      logHabit({ 
        habitKey: 'piano', 
        value: selectedDuration, 
        taskName: 'Piano Practice' 
      });
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const handleMarkDone = () => {
    if (selectedDuration > 0) {
      logHabit({ 
        habitKey: 'piano', 
        value: selectedDuration, 
        taskName: 'Piano Practice' 
      });
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const handleSongCheck = (song: string, checked: boolean) => {
    setTimerState(prevState => ({
      ...prevState,
      completedSongs: checked 
        ? [...prevState.completedSongs, song] 
        : prevState.completedSongs.filter((s) => s !== song)
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const durationOptions = [1, 5, 10, 15, 20, 30, 45, 60];

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 py-6">
      <div className="w-full space-y-8">
        <PageHeader title="Piano Practice" backLink="/" />
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="piano-duration" className="text-lg font-medium text-muted-foreground">
              Duration (minutes)
            </Label>
            <Select 
              value={String(selectedDuration)} 
              onValueChange={(value) => setSelectedDuration(Number(value))}
              disabled={isActive || isPending}
            >
              <SelectTrigger id="piano-duration" className="w-full text-lg h-14 rounded-2xl">
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
          
          <Card className="rounded-2xl shadow-lg border-4 border-habit-purple overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col items-center">
                <div className="bg-purple-50 rounded-full w-24 h-24 flex items-center justify-center mb-6">
                  <Music className="w-12 h-12 text-purple-500" />
                </div>
                
                <div className="p-10 bg-card rounded-full w-56 h-56 flex items-center justify-center mx-auto border-4 border-purple-100">
                  <p className="text-6xl font-extrabold tracking-tighter text-habit-purple">
                    {formatTime(timeRemaining)}
                  </p>
                </div>
                
                <div className="flex items-center justify-center space-x-6 mt-8">
                  <Button 
                    size="lg" 
                    className="w-36 h-16 rounded-full bg-habit-purple hover:bg-habit-purple/90"
                    onClick={handleToggle}
                    disabled={isFinished || isPending}
                  >
                    {isActive ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8" />
                    )}
                  </Button>
                  
                  {(isActive || isFinished) && (
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
          <div className="bg-muted/30 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <Music className="w-4 h-4 mr-2" />
              Gig Tracker ({completedSongs.length} / {targetSongs.length} Songs)
            </h2>
            <div className="space-y-2">
              {targetSongs.map((song, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-background rounded-lg border">
                  <Checkbox 
                    id={`song-${index}`} 
                    checked={completedSongs.includes(song)}
                    onCheckedChange={(checked) => handleSongCheck(song, checked as boolean)}
                    disabled={isPending}
                  />
                  <Label htmlFor={`song-${index}`} className="text-base font-medium flex-grow">
                    {song}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {isFinished ? (
            <Button 
              className="w-full bg-green-500 hover:bg-green-600 text-lg py-6 rounded-2xl"
              onClick={handleLog}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                `Log ${selectedDuration} minute session`
              )}
            </Button>
          ) : (
            <Button 
              className="w-full bg-habit-green hover:bg-habit-green/90 text-habit-green-foreground text-lg py-6 rounded-2xl"
              onClick={handleMarkDone}
              disabled={isPending || selectedDuration <= 0}
            >
              {isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Check className="w-6 h-6 mr-2" />
                  Mark Done
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PianoLog;