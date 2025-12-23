"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Square, Play, Pause, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export const FloatingTimer = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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

  if (!activeTimer) return null;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Theme-aware colors
  const timerBg = isDark ? "bg-[hsl(var(--card))]/95" : "bg-[hsl(var(--card))]/95";
  const timerBorder = isDark ? "border-[hsl(var(--border))]" : "border-[hsl(var(--border))]";
  const timerText = isDark ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--foreground))]";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        className="fixed bottom-24 right-6 z-[110]"
      >
        <div className={cn("backdrop-blur-md border rounded-2xl p-3 shadow-2xl flex items-center gap-4 min-w-[200px]", timerBg, timerBorder, timerText)}>
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))]/20 flex items-center justify-center border border-[hsl(var(--primary))]/30">
            <Timer className="w-5 h-5 text-[hsl(var(--primary))]" />
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
            className="rounded-full hover:bg-[hsl(var(--muted))]" 
            onClick={() => navigate('/')}
          >
            <ExternalLink className="w-4 h-4 opacity-50" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};