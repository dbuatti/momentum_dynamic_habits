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
  value: number; // Planned goal for this chunk (in minutes or reps)
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTiming(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 100);
  };

  const handlePauseTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused) {
      setIsPaused(false);
      startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 100);
    } else {
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

    const actualMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    if (showMood && mood === undefined) {
      setShowMoodPicker(true);
      return;
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fb923c', '#60a5fa', '#4ade80', '#a78bfa', '#f87171', '#a78bfa'],
    });

    onComplete(actualMinutes, mood);
    setIsTiming(false);
    setElapsedSeconds(0);
    setShowMoodPicker(false);
  };

  const handleQuickComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) return;

    if (showMood) {
      setShowMoodPicker(true);
      return;
    }

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    onComplete(value);
  };

  // Calculate fill percentage (0–100%) during timing
  const progressPercent = isTiming
    ? Math.min(100, (elapsedSeconds / (value * 60)) * 100)
    : 0;

  const colorMap = {
    orange: { light: 'from-orange-300/70', dark: 'to-orange-500/90', wave: '#fb923c' },
    blue: { light: 'from-blue-300/70', dark: 'to-blue-500/90', wave: '#60a5fa' },
    green: { light: 'from-green-300/70', dark: 'to-green-500/90', wave: '#4ade80' },
    purple: { light: 'from-purple-300/70', dark: 'to-purple-500/90', wave: '#a78bfa' },
    red: { light: 'from-red-300/70', dark: 'to-red-500/90', wave: '#f87171' },
    indigo: { light: 'from-indigo-300/70', dark: 'to-indigo-500/90', wave: '#6366f1' },
  };

  const colors = colorMap[color];

  return (
    <motion.div layout className="relative">
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-500 border-2",
          isCompleted
            ? "bg-muted/40 border-muted opacity-75"
            : "bg-white/80 backdrop-blur-sm border-transparent",
          isTiming && "ring-4 ring-primary/30 shadow-xl scale-[1.02]"
        )}
        onClick={(!isCompleted && !isTiming && !showMoodPicker)
          ? (isTimeBased ? handleStartTimer : handleQuickComplete)
          : undefined}
      >
        {/* Rising Water Fill Effect */}
        <AnimatePresence>
          {isTiming && (
            <motion.div
              className="absolute inset-x-0 bottom-0 z-0"
              initial={{ height: "0%" }}
              animate={{ height: `${progressPercent}%` }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.6 }}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-t", colors.light, colors.dark)} />
              {/* Subtle wave on top */}
              <div
                className="absolute inset-x-0 top-0 h-4 opacity-60"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${colors.wave}66 50%, transparent 100%)`,
                  animation: 'wave 4s linear infinite',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 p-4">
          {!isTiming ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-white border-2 border-dashed border-current/30"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : isTimeBased ? (
                    <Play className="w-5 h-5 ml-0.5" />
                  ) : (
                    <span className="text-sm font-black">{value}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-bold text-base leading-tight truncate">{label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold opacity-70">
                      {value} {unit}
                    </span>
                    {scheduledTime && (
                      <span className="flex items-center gap-1 text-xs opacity-60 bg-white/50 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onUncomplete();
                  }}
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  {isTimeBased && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={handleQuickComplete}
                      title="Mark done manually"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                  <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center opacity-50">
                    <Check className="w-5 h-5" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5 py-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider opacity-60">Timing {label}</p>
                  <p className="text-4xl font-black tabular-nums mt-2">{formatTime(elapsedSeconds)}</p>
                  <p className="text-xs opacity-60 mt-2">Goal: {value} min</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg"
                    variant={isPaused ? "default" : "secondary"}
                    onClick={handlePauseTimer}
                  >
                    {isPaused ? <Play className="w-6 h-6 ml-0.5" /> : <Pause className="w-6 h-6" />}
                  </Button>
                  <Button
                    size="lg"
                    className="h-12 px-6 rounded-full font-bold shadow-lg"
                    onClick={() => handleFinishTiming()}
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showMoodPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/95 backdrop-blur border-t"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-3 px-4 flex items-center justify-center gap-6">
                <span className="text-xs font-bold uppercase opacity-70">How was it?</span>
                <div className="flex gap-3">
                  <Button size="icon" variant="ghost" onClick={() => handleFinishTiming('sad')}>
                    <Frown className="w-5 h-5 text-red-500" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleFinishTiming('neutral')}>
                    <Meh className="w-5 h-5 text-yellow-500" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleFinishTiming('happy')}>
                    <Smile className="w-5 h-5 text-green-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleFinishTiming()}>
                    Skip
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* CSS for wave animation */}
      <style jsx>{`
        @keyframes wave {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </motion.div>
  );
};