"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, X, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestTimerProps {
  duration?: number; // seconds
  onComplete: () => void;
  onCancel: () => void;
}

const RestTimer: React.FC<RestTimerProps> = ({ duration = 60, onComplete, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border-2 border-warning-border rounded-3xl p-8 w-full max-w-sm shadow-xl text-center space-y-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center">
          <div className="bg-warning-background p-2 rounded-full">
            <Timer className="w-5 h-5 text-warning" />
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold">Rest Period</h3>
          <p className="text-muted-foreground text-sm">Breathe deep and recover for your next set.</p>
        </div>

        <div className="text-6xl font-black text-warning tabular-nums">
          {formatTime(timeLeft)}
        </div>

        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="w-12 h-12 rounded-full"
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="w-12 h-12 rounded-full"
            onClick={() => setTimeLeft(duration)}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        <Button className="w-full rounded-2xl h-12" onClick={onComplete}>
          Skip Rest
        </Button>
      </div>
    </div>
  );
};

export default RestTimer;