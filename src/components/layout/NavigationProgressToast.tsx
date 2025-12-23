"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardData } from '@/hooks/useDashboardData';
import { calculateDailyParts } from '@/utils/progress-utils';
import { cn } from '@/lib/utils';
import { Target, CheckCircle2 } from 'lucide-react';

export const NavigationProgressToast = () => {
  const { data, isLoading } = useDashboardData();

  if (isLoading || !data) return null;

  const { completed, total } = calculateDailyParts(data.habits, data.neurodivergentMode);
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed === total && total > 0;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={completed} // Re-animate when progress changes
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            "bg-card/80 backdrop-blur-xl border border-border/50 rounded-full px-4 py-2 shadow-2xl flex items-center gap-3",
            isComplete && "bg-success/10 border-success/30"
          )}
        >
          <div className="relative w-5 h-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-muted/20"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (283 * percentage) / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={isComplete ? "text-success" : "text-primary"}
              />
            </svg>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground/70">
              {isComplete ? "Journey Harmonized" : "Daily Momentum"}
            </span>
            <span className="text-xs font-black tabular-nums">
              {completed}/{total}
            </span>
            {isComplete && <CheckCircle2 className="w-3 h-3 text-success" />}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};