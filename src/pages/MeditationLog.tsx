import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Square, Loader2 } from 'lucide-react';
import { useHabitLog } from '@/hooks/useHabitLog';

const MeditationLog = () => {
  const [time, setTime] = useState(0); // in seconds
  const [isActive, setIsActive] = useState(false);
  const { mutate: logHabit, isPending } = useHabitLog();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const handleLog = () => {
    const minutes = Math.floor(time / 60);
    if (minutes > 0) {
      logHabit({
        habitKey: 'meditation',
        value: minutes,
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
          <p className="text-6xl font-extrabold tracking-tighter">{formatTime(time)}</p>
        </div>

        <Button 
          size="lg" 
          className="w-32 h-16 rounded-full bg-indigo-500 hover:bg-indigo-600"
          onClick={handleToggle}
          disabled={isPending}
        >
          {isActive ? <Square className="w-8 h-8" /> : <Play className="w-8 h-8" />}
        </Button>

        {!isActive && time > 59 && (
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 text-lg py-6" 
            onClick={handleLog} 
            disabled={isPending}
          >
            {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : `Log ${Math.floor(time / 60)} minute session`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MeditationLog;