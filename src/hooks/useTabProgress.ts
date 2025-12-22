"use client";

import { useEffect } from 'react';
import { useDashboardData } from './useDashboardData';
import { calculateDailyParts } from '@/utils/progress-utils';

export const useTabProgress = () => {
  const { data } = useDashboardData();

  useEffect(() => {
    if (!data) return;

    const { completed, total } = calculateDailyParts(data.habits);
    const streak = data.patterns.streak;
    
    // Format: Adaptive Growth • 12/18 • 🔥10
    const title = `Adaptive Growth • ${completed}/${total} • 🔥${streak}`;
    
    const originalTitle = document.title;
    document.title = title;

    return () => {
      document.title = originalTitle;
    };
  }, [data]);
};