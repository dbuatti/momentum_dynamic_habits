"use client";

import { useEffect, useState } from 'react';
import { useDashboardData } from './useDashboardData';
import { calculateDailyParts } from '@/utils/progress-utils';

export const useTabProgress = () => {
  const { data } = useDashboardData();
  const [activeTimer, setActiveTimer] = useState<{ label: string; remaining: number; habitName: string; goalValue: number } | null>(null);

  useEffect(() => {
    // Listen for timer updates from HabitCapsules
    const handleTimerUpdate = (e: any) => {
      setActiveTimer(e.detail);
    };

    window.addEventListener('habit-timer-update', handleTimerUpdate);
    return () => window.removeEventListener('habit-timer-update', handleTimerUpdate);
  }, []);

  useEffect(() => {
    if (!data) return;

    const { completed, total } = calculateDailyParts(data.habits, data.neurodivergentMode);
    const streak = data.patterns.streak;
    
    let title = "";

    if (activeTimer) {
      const mins = Math.floor(activeTimer.remaining / 60);
      const secs = (activeTimer.remaining % 60).toString().padStart(2, '0');
      const timeStr = `${mins}:${secs}`;
      // Updated title to show remaining time countdown
      title = `${timeStr} rem ↓ ${activeTimer.habitName} – ${activeTimer.label} | Adaptive Growth`;
    } else {
      // Default: Adaptive Growth • 12/18 • 🔥10
      title = `Adaptive Growth • ${completed}/${total} • 🔥${streak}`;
    }
    
    const originalTitle = document.title;
    document.title = title;

    return () => {
      document.title = originalTitle;
    };
  }, [data, activeTimer]);
};