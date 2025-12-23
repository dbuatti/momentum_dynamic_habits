"use client";

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Flame, X } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { calculateDailyParts } from '@/utils/progress-utils';
import { Progress } from '@/components/ui/progress';
import { getXpForNextLevel, getXpForCurrentLevelStart } from '@/utils/leveling';
import { cn } from '@/lib/utils';

const MESSAGES = [
  "Keep going!",
  "You're building momentum",
  "Small wins add up",
  "Consistency is key",
  "One step at a time",
  "Focus on the process",
  "You've got this!"
];

export const NavigationProgressToast = () => {
  const location = useLocation();
  const { data } = useDashboardData();
  const [isVisible, setIsVisible] = useState(false);
  const [lastPath, setLastPath] = useState(location.pathname);
  const [message, setMessage] = useState(MESSAGES[0]);

  useEffect(() => {
    // Trigger on tab navigation, but not initial load
    if (location.pathname !== lastPath) {
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      setIsVisible(true);
      setLastPath(location.pathname);

      const timer = setTimeout(() => setIsVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, lastPath]);

  if (!data) return null;

  const { completed, total } = calculateDailyParts(data.habits, data.neurodivergentMode);
  const xpStart = getXpForCurrentLevelStart(data.level);
  const xpNext = getXpForNextLevel(data.level);
  const xpProgress = ((data.xp - xpStart) / (xpNext - xpStart)) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-2xl shadow-primary/20 text-foreground">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Level {data.level}</p>
                  <p className="text-sm font-bold">{message}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-4 h-4 opacity-50" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold opacity-70">
                  <span>Progress to Level {data.level + 1}</span>
                  <span>{Math.round(xpProgress)}%</span>
                </div>
                <Progress value={xpProgress} className="h-1 bg-secondary [&>div]:bg-primary" />
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-success-background/20 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-success" />
                  </div>
                  <span className="text-xs font-bold">{completed}/{total} parts done</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-warning-background/20 flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5 text-warning" />
                  </div>
                  <span className="text-xs font-bold">{data.patterns.streak} day streak</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};