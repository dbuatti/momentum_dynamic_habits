import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useHabitLog } from '@/hooks/useHabitLog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  isFinished: boolean;
  startTime: number | null; // Timestamp when timer was last started/resumed (Date.now())
  selectedDuration: number; // The duration chosen by the user in minutes
  completedSongs: string[]; // Persist completed songs for PianoLog
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
      completedSongs: [],
    };
  }, [selectedDuration, initialTimeInSeconds]);

  const [timerState, setTimerState] = useState<TimerState>(getInitialState);
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
      completedSongs: [],
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear from localStorage
  };

  const handleLog = () => {
    if (selectedDuration > 0) {
      logHabit({
        habitKey: 'piano',
        value: selectedDuration,
        taskName: 'Piano Practice',
      });
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear from localStorage after logging
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
    <div className="flex flex-col items-center">
      <div className="text-center space-y-6 mt-12 w-full max-w-md">
        <h1 className="text-4xl font-bold text-habit-purple-foreground">Piano Practice</h1>
        
        <div className="space-y-2">
          <Label htmlFor="piano-duration" className="text-lg font-medium text-muted-foreground">Duration (minutes)</Label>
          <Select value={String(selectedDuration)} onValueChange={(value) => setSelectedDuration(Number(value))} disabled={isActive || isPending}>
            <SelectTrigger id="piano-duration" className="w-full text-lg h-12">
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

        <div className="p-6 bg-card rounded-xl shadow-lg border-4 border-habit-purple-border">
            <p className="text-4xl font-extrabold">{formatTime(timeRemaining)}</p>
            <div className="flex items-center justify-center space-x-4 mt-4">
                <Button 
                    size="lg" 
                    className="w-32 h-16 rounded-full bg-habit-purple-foreground hover:bg-habit-purple-foreground/90"
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

        <div className="space-y-3 text-left">
            <h2 className="text-xl font-semibold">Gig Tracker ({completedSongs.length} / {targetSongs.length} Songs)</h2>
            {targetSongs.map((song, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded-md">
                    <Checkbox 
                        id={`song-${index}`} 
                        checked={completedSongs.includes(song)}
                        onCheckedChange={(checked) => handleSongCheck(song, checked as boolean)}
                        disabled={isPending}
                    />
                    <Label htmlFor={`song-${index}`} className="text-base font-medium">
                        {song}
                    </Label>
                </div>
            ))}
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
      </div>
    </div>
  );
};

export default PianoLog;