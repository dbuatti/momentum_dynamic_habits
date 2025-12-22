"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, Smile, Meh, Frown, Undo2, Play, Pause, Square, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface HabitCapsuleProps {
  id: string;
  habitKey: string;
  label: string;
  value: number; // The planned goal for this chunk
  unit: string;
  isCompleted: boolean;
  scheduledTime?: string;
  onComplete: (actualValue: number, mood?: string) => void;
  onUncomplete: () => void;
  color: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo';
  showMood?: boolean;
}

export const HabitCapsule: React.FC<HabitCapsuleProps> = ({
  label,
  value,
  unit,
  isCompleted,
  scheduledTime,
  onComplete,
  onUncomplete,
  color,
  showMood,
}) => {
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [isTiming, setIsTiming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isTimeBased = unit === 'min';

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTiming(true);
    setIsPaused(false);
    startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
    
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  };

  const handlePauseTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused) {
      // Resume
      setIsPaused(false);
      startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } else {
      // Pause
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishTiming = (mood?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Calculate actual minutes (at least 1 if they started it, rounded)
    const actualMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60));
    
    if (showMood && !mood) {
      setShowMoodPicker(true);
      return;
    }

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#fb923c', '#60a5fa', '#4ade80', '#a78bfa']
    });

    onComplete(actualMinutes, mood);
    setIsTiming(false);
    setElapsedSeconds(0);
    setShowMoodPicker(false);
  };

  const handleQuickComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) return;
    
    if (showMood && !showMoodPicker) {
      setShowMoodPicker(true);
      return;
    }

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });

    onComplete(value); // Log the full planned value
    setShowMoodPicker(false);
  };

  const colorVariants = {
    orange: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100/50',
    blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100/50',
    green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100/50',
    purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100/50',
    red: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100/50',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/50',
  };

  return (
    <motion.div layout>
      <Card 
        className={cn(
          "relative overflow-hidden transition-all border-2",
          isCompleted ? "bg-muted/30 border-muted opacity-80" : colorVariants[color],
          isTiming && !isCompleted && "ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-lg"
        )}
        onClick={(!isCompleted && !isTiming && !showMoodPicker) ? (isTimeBased ? handleStartTimer : handleQuickComplete) : undefined}
      >
        <div className="p-3">
          {!isTiming ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isCompleted ? "bg-green-500 text-white" : "bg-white/50"
                )}>
                  {isCompleted ? <Check className="w-5 h-5" /> : (
                    isTimeBased ? <Play className="w-4 h-4 fill-current" /> : <div className="text-[10px] font-bold">{value}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate leading-tight">{label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] opacity-70 font-medium">{value} {unit}</span>
                    {scheduledTime && (
                      <span className="flex items-center gap-1 text-[10px] opacity-70 bg-white/30 px-1.5 rounded">
                        <Clock className="w-2.5 h-2.5" />
                        {scheduledTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isCompleted ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-[10px] font-bold text-muted-foreground hover:bg-white/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUncomplete();
                  }}
                >
                  <Undo2 className="w-3.5 h-3.5 mr-1" />
                  Undo
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  {isTimeBased && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-full" 
                      onClick={handleQuickComplete}
                      title="Log manually"
                    >
                      <Edit2 className="w-3.5 h-3.5 opacity-40" />
                    </Button>
                  )}
                  <div className="h-8 w-8 flex items-center justify-center opacity-40">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase opacity-60 tracking-wider">Active {label}</span>
                  <span className="text-2xl font-black tabular-nums">{formatTime(elapsedSeconds)}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    className="h-10 w-10 rounded-full bg-white text-black hover:bg-white/90 shadow-sm border" 
                    onClick={handlePauseTimer}
                  >
                    {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-10 px-4 rounded-full bg-primary text-primary-foreground font-bold shadow-md"
                    onClick={() => handleFinishTiming()}
                  >
                    <Square className="w-4 h-4 mr-2 fill-current" />
                    Finish
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-center opacity-60 font-medium">Goal: {value} minutes • Timing your actual progress...</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showMoodPicker && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="bg-white/90 backdrop-blur-sm border-t border-inherit overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 flex items-center justify-around">
                <p className="text-[10px] font-bold uppercase opacity-60">Mood?</p>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-red-100" onClick={() => handleFinishTiming('sad')}>
                    <Frown className="w-4 h-4 text-red-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-yellow-100" onClick={() => handleFinishTiming('neutral')}>
                    <Meh className="w-4 h-4 text-yellow-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-green-100" onClick={() => handleFinishTiming('happy')}>
                    <Smile className="w-4 h-4 text-green-500" />
                  </Button>
                  <Button variant="ghost" className="text-[10px] h-8 px-2" onClick={() => handleFinishTiming()}>Skip</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};