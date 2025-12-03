import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';

const MeditationLog = () => {
  const location = useLocation();
  const durationInMinutes = location.state?.duration || 1;
  const initialTime = durationInMinutes * 60;

  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const { mutate: logHabit, isPending } = useHabitLog();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playSound = () => {
    const audioContext = new (window.AudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5 note
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      setIsActive(false);
      setIsFinished(true);
      playSound();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeRemaining]);

  const handleToggle = () => {
    if (isFinished) return;
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsFinished(false);
    setTimeRemaining(initialTime);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleLog = () => {
    if (durationInMinutes > 0) {
      logHabit({
        habitKey: 'meditation',
        value: durationInMinutes,
        taskName: 'Meditation',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Link to="/" className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" disabled={isPending || isActive}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </Link>
      <div className="text-center space-y-8 w-full max-w-xs">
        <h1 className="text-4xl font-bold text-indigo-500">Meditation Timer</h1>
        
        <div className="p-10 bg-card rounded-full w-56 h-56 flex items-center justify-center mx-auto shadow-xl border-4 border-indigo-300">
          <p className="text-6xl font-extrabold tracking-tighter">{formatTime(timeRemaining)}</p>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <Button 
            size="lg" 
            className="w-32 h-16 rounded-full bg-indigo-500 hover:bg-indigo-600"
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