import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';
import { useJourneyData } from '@/hooks/useJourneyData';

interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  isFinished: boolean;
  startTime: number | null; // Timestamp when timer was last started/resumed (Date.now())
  durationInMinutes: number; // Initial duration for reset
}

const LOCAL_STORAGE_KEY = 'meditationTimerState';

const MeditationLog = () => {
  const location = useLocation();
  const initialDurationInMinutes = location.state?.duration || 1;
  const initialTimeInSeconds = initialDurationInMinutes * 60;

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
  }, [selectedMeditationSound]); // selectedMeditationSound is a dependency

  // Initialize state from localStorage or defaults
  const getInitialState = useCallback((): TimerState => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsedState: TimerState = JSON.parse(savedState);
        // If the saved state is for a different initial duration, reset it
        if (parsedState.durationInMinutes !== initialDurationInMinutes) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          return {
            timeRemaining: initialTimeInSeconds,
            isActive: false,
            isFinished: false,
            startTime: null,
            durationInMinutes: initialDurationInMinutes,
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
      durationInMinutes: initialDurationInMinutes,
    };
  }, [initialDurationInMinutes, initialTimeInSeconds, playSound, selectedMeditationSound]);

  const [timerState, setTimerState] = useState<TimerState>(getInitialState);
  const { timeRemaining, isActive, isFinished, durationInMinutes } = timerState;

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
      timeRemaining: initialTimeInSeconds,
      isActive: false,
      isFinished: false,
      startTime: null,
      durationInMinutes: initialDurationInMinutes,
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear from localStorage
  };

  const handleLog = () => {
    if (durationInMinutes > 0) {
      logHabit({
        habitKey: 'meditation',
        value: durationInMinutes,
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

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-center space-y-8 w-full max-w-xs">
        <h1 className="text-4xl font-bold text-habit-blue">Meditation Timer</h1>
        
        <div className="p-10 bg-card rounded-full w-56 h-56 flex items-center justify-center mx-auto shadow-xl border-4 border-indigo-300">
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
            {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : `Log ${durationInMinutes} minute session`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MeditationLog;