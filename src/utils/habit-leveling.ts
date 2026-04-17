import { UserHabitRecord } from "@/types/habit";

/**
 * Calculates the XP required to reach the NEXT level from the current level.
 * Uses an exponential curve: 3, 5, 8, 13, 21, 34... (Fibonacci-like)
 */
export const getXpForNextHabitLevel = (level: number): number => {
  if (level <= 0) return 3;
  
  // Simple exponential growth: 3 * 1.6^(level-1)
  return Math.round(3 * Math.pow(1.6, level - 1));
};

/**
 * Calculates the current level based on total XP.
 * This is the inverse of the cumulative XP required.
 */
export const calculateHabitLevel = (xp: number): number => {
  let level = 1;
  let remainingXp = xp;
  
  while (true) {
    const xpNeeded = getXpForNextHabitLevel(level);
    if (remainingXp >= xpNeeded) {
      remainingXp -= xpNeeded;
      level++;
    } else {
      break;
    }
  }
  
  return level;
};

/**
 * Calculates how much XP is earned for a single completion.
 * Base XP is 1. We could scale this based on habit difficulty in the future.
 */
export const getXpGainPerCompletion = (habit: UserHabitRecord, isBonus: boolean = false): number => {
  // For now, every full completion of the daily goal grants 1 XP.
  // Bonus sessions grant 0.2 XP.
  if (isBonus) return 0.2;
  return 1;
};

/**
 * Returns the progress within the current level (0 to 1).
 */
export const getLevelProgress = (xp: number): number => {
  let level = 1;
  let remainingXp = xp;
  
  while (true) {
    const xpNeeded = getXpForNextHabitLevel(level);
    if (remainingXp >= xpNeeded) {
      remainingXp -= xpNeeded;
      level++;
    } else {
      return remainingXp / xpNeeded;
    }
  }
};

/**
 * Returns the XP earned within the current level and the total needed for next level.
 */
export const getLevelXpStats = (xp: number) => {
  let level = 1;
  let remainingXp = xp;
  
  while (true) {
    const xpNeeded = getXpForNextHabitLevel(level);
    if (remainingXp >= xpNeeded) {
      remainingXp -= xpNeeded;
      level++;
    } else {
      return {
        currentLevel: level,
        xpInLevel: remainingXp,
        xpNeededForNext: xpNeeded,
        totalXp: xp
      };
    }
  }
};
