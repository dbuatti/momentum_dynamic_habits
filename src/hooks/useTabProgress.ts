"use client";

import { useEffect, useState } from 'react';
import { useDashboardData } from './useDashboardData';
import { calculateDailyParts } from '@/utils/progress-utils';

export const useTabProgress = () => {
  const { data } = useDashboardData();
  const [activeTimer, setActiveTimer] = useState<{ label: string; elapsed: number; habitName: string; goalValue: number } | null>(null);

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

    const { completed, total } = calculateDailyParts(data.habits);
    const streak = data.patterns.streak;
    
    let title = "";

    if (activeTimer) {
      const mins = Math.floor(activeTimer.elapsed / 60);
      const secs = (activeTimer.elapsed % 60).toString().padStart(2, '0');
      const timeStr = `${mins}:${secs}`;
      // Rich title format: 07:23 ↑ Project Work – Part 2 (15 min goal) | Adaptive Growth
      title = `${timeStr} ↑ ${activeTimer.habitName} – ${activeTimer.label} (${activeTimer.goalValue} min goal) | Adaptive Growth`;
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