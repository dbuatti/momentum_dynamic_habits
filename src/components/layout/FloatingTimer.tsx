"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Square, Play, Pause, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const FloatingTimer = () => {
  const [activeTimer, setActiveTimer] = useState<{ label: string; elapsed: number; isPaused: boolean; habitKey: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleTimerUpdate = (e: any) => {
      setActiveTimer(e.detail);
    };

    window.addEventListener('habit-timer-update', handleTimerUpdate);
    return () => window.removeEventListener('habit-timer-update', handleTimerUpdate);
  }, []);

  // Don't show if we are already on the Dashboard where the actual capsule is visible
  // and we can see the full UI. However, it's safer to show it if we scroll down.
  // For now, let's show it only if we are NOT on the home page or if scrolled.
  if (!activeTimer) return null;

  const formatTime = (totalSeconds: number) => {
    const roundedTotalSeconds = Math.round(totalSeconds); // Round the total seconds first
    const mins = Math.floor(roundedTotalSeconds / 60);
    const secs = roundedTotalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        className="fixed bottom-24 right-6 z-[110]"
      >
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-3 shadow-2xl flex items-center gap-4 text-foreground min-w-[200px]">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Timer className="w-5 h-5 text-primary animate-pulse" />
          </div>
          
          <div className="flex-grow pr-2">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 truncate max-w-[120px]">
              {activeTimer.label}
            </p>
            <p className="text-xl font-black tabular-nums">
              {formatTime(activeTimer.elapsed)}
            </p>
          </div>

          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full hover:bg-secondary h-8 w-8"
            onClick={() => navigate('/')}
          >
            <ExternalLink className="w-4 h-4 opacity-50" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};