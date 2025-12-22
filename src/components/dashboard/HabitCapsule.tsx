"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, Smile, Meh, Frown, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface HabitCapsuleProps {
  id: string;
  habitKey: string;
  label: string;
  value: number;
  unit: string;
  isCompleted: boolean;
  scheduledTime?: string;
  onComplete: (mood?: string) => void;
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

  const handleComplete = (mood?: string) => {
    if (isCompleted) return;
    
    if (showMood && !mood && !showMoodPicker) {
      setShowMoodPicker(true);
      return;
    }

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#fb923c', '#60a5fa', '#4ade80', '#a78bfa']
    });

    onComplete(mood);
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
          "relative overflow-hidden transition-all border-2 cursor-pointer",
          isCompleted ? "bg-muted/30 border-muted opacity-80" : colorVariants[color]
        )}
        onClick={() => !isCompleted && !showMoodPicker ? handleComplete() : undefined}
      >
        <div className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
              isCompleted ? "bg-green-500 text-white" : "bg-white/50"
            )}>
              {isCompleted ? <Check className="w-5 h-5" /> : <div className="text-[10px] font-bold">{value}</div>}
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
            <div className="h-8 w-8 flex items-center justify-center opacity-40">
              <Check className="w-4 h-4" />
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
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-red-100" onClick={() => handleComplete('sad')}>
                    <Frown className="w-4 h-4 text-red-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-yellow-100" onClick={() => handleComplete('neutral')}>
                    <Meh className="w-4 h-4 text-yellow-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-green-100" onClick={() => handleComplete('happy')}>
                    <Smile className="w-4 h-4 text-green-500" />
                  </Button>
                  <Button variant="ghost" className="text-[10px] h-8 px-2" onClick={() => handleComplete()}>Skip</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};