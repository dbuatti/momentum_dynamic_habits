"use client";

import { useCallback } from 'react';
import { useDashboardData } from './useDashboardData';
import { playStartSound, playEndSound, playGoalSound } from '@/utils/audio';

type FeedbackType = 'start' | 'pause' | 'completion' | 'goal_reached';

export const useFeedback = () => {
  const { data } = useDashboardData();
  
  const enableSound = data?.neurodivergentMode !== undefined ? (data as any).enable_sound ?? true : true;
  const enableHaptics = data?.neurodivergentMode !== undefined ? (data as any).enable_haptics ?? true : true;

  const triggerFeedback = useCallback((type: FeedbackType) => {
    // 1. Handle Haptics
    if (enableHaptics && typeof window !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'start':
          navigator.vibrate(10);
          break;
        case 'pause':
          navigator.vibrate(5);
          break;
        case 'completion':
          navigator.vibrate([20, 50, 20]);
          break;
        case 'goal_reached':
          navigator.vibrate([30, 100, 30, 100, 50]);
          break;
      }
    }

    // 2. Handle Sound
    if (enableSound) {
      switch (type) {
        case 'start':
          playStartSound();
          break;
        case 'completion':
          playEndSound();
          break;
        case 'goal_reached':
          playGoalSound();
          break;
        // Pause usually doesn't have a specific sound in our current audio utility
      }
    }
    
    console.log(`[Feedback] Triggered ${type} (Sound: ${enableSound}, Haptics: ${enableHaptics})`);
  }, [enableSound, enableHaptics]);

  return { triggerFeedback };
};