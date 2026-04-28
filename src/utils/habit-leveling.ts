import { UserHabitRecord } from "@/types/habit";

/**
 * Standardized XP Rewards based on effort:
 * - Time: 1 second = 1 XP (1 minute = 60 XP)
 * - Count: 1 rep = 25 XP (Matches ~10-15 seconds of physical effort)
 * - Binary: 1 completion = 200 XP (High reward for critical adherence)
 */

/**
 * Calculates the XP required to reach the NEXT level from the current level.
 * Level 1 -> 2: 300 XP (Fast initial hook)
 * Level 2 -> 3: 450 XP
 * Level 3 -> 4: 675 XP
 */
export const getXpForNextHabitLevel = (level: number): number => {
  if (level <= 0) return 300;
  // Base 300 XP, growing by 50% each level
  return Math.round(300 * Math.pow(1.5, level - 1));
};

/**
 * Calculates the current level based on total XP.
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
 * Calculates how much XP is earned for a single completion of a Simple Task.
 */
export const getXpGainForTask = (type: 'count' | 'time', value: number): number => {
  // value is seconds for 'time', reps for 'count'
  const multiplier = type === 'count' ? 25 : 1;
  return value * multiplier;
};

/**
 * Calculates how much XP is earned for a Dashboard Habit completion.
 */
export const getXpGainPerCompletion = (value: number, unit: string, isBonus: boolean = false): number => {
  // value is minutes for 'min', reps for 'reps', doses for 'dose'
  let multiplier = 1;
  
  if (unit === 'min') multiplier = 60;
  else if (unit === 'reps') multiplier = 25;
  else if (unit === 'dose') multiplier = 200;

  const baseXP = value * multiplier;
  return isBonus ? Math.round(baseXP * 0.5) : Math.round(baseXP);
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