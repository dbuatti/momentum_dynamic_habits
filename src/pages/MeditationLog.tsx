import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { useJourneyData } from '@/hooks/useJourneyData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';

interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  isFinished: boolean;
  startTime: number | null; // Timestamp when timer was last started/resumed (Date.now())
  selectedDuration: number; // The duration chosen by the user in minutes
}

const LOCAL_STORAGE_KEY = 'meditationTimerState';

const MeditationLog = () => {
  const location = useLocation();
  const initialDurationFromState = location.state?.duration || 1; // Default from dashboard or 1 min

  const [selectedDuration, setSelectedDuration] = useState<number>(initialDurationFromState);
  const initialTimeInSeconds = selectedDuration * 60;

  const { data: journeyData } = useJourneyData();
  const selectedMeditationSound = journeyData?.profile?.meditation_sound || 'Forest';

  const playSound = useCallback((soundKey: string) => {
    if (soundKey === 'Silence') {
      console.log('Meditation finished: Silence selected, no sound played.');
      return;
    }

    const audioContext = new (window.AudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    let frequency = 523.25; // Default C5
    let duration = 0.5; // Default duration
    let type: OscillatorType = 'sine';

    switch (soundKey) {
      case 'Rain':
        frequency = 220; // A3
        duration = 0.7;
        type = 'sawtooth';
        break;
      case 'Forest':
        frequency = 330; // E4
        duration = 0.6;
        type = 'sine';
        break;
      case 'Ocean':
        frequency = 277; // C#4
        duration = 0.8;
        type = 'triangle';
        break;
      case 'Fire':
        frequency = 554; // C#5
        duration = 0.4;
        type = 'square';
        break;
      case 'Wind':
        frequency = 494; // B4
        duration = 0.7;
        type = 'sine';
        break;
      case 'Birds':
        frequency = 880; // A5
        duration = 0.3;
        type = 'sine';
        break;
      case 'Stream':
        frequency = 392; // G4
        duration = 0.9;
        type = 'triangle';
        break;
      default:
        // Default to 'Forest' sound if not explicitly handled
        frequency = 330; // E4
        duration = 0.6;
        type = 'sine';
    }

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
    console.log(`Meditation finished: Playing ${soundKey} sound.`);
  }, [selectedMeditationSound]);

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
            playSound(selectedMeditationSound); // Play sound if it finished in background
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
  }, [selectedDuration, initialTimeInSeconds, playSound, selectedMeditationSound]);

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
            playSound(selectedMeditationSound);
            return { ...prevState, timeRemaining: 0, isActive: false, isFinished: true, startTime: null };
          }
          return { ...prevState, timeRemaining: newTime };
        });
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimerState(prevState => ({ ...prevState, isActive: false, isFinished: true, startTime: null }));
      playSound(selectedMeditationSound);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeRemaining, playSound, selectedMeditationSound]);

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
        habitKey: 'meditation',
        value: selectedDuration,
        taskName: 'Meditation',
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
    <div className="flex flex-col items-center">
      <div className="text-center space-y-8 w-full max-w-xs">
        <PageHeader title="Meditation Timer" backLink="/" />
        
        <div className="space-y-2">
          <Label htmlFor="meditation-duration" className="text-lg font-medium text-muted-foreground">Duration (minutes)</Label>
          <Select value={String(selectedDuration)} onValueChange={(value) => setSelectedDuration(Number(value))} disabled={isActive || isPending}>
            <SelectTrigger id="meditation-duration" className="w-full text-lg h-12">
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

        <div className="p-10 bg-card rounded-full w-56 h-56 flex items-center justify-center mx-auto shadow-xl border-4 border-habit-blue">
          <p className="text-6xl font-extrabold tracking-tighter">{formatTime(timeRemaining)}</p>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <Button 
            size="lg" 
            className="w-32 h-16 rounded-full bg-habit-blue hover:bg-blue-600"
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

export default MeditationLog;