import { UserHabitRecord } from "@/types/habit";

/**
 * Calculates the XP required to reach the NEXT level from the current level.
 * Level 1 -> 2: 50 XP
 * Level 2 -> 3: 75 XP
 * Level 3 -> 4: 112 XP
 */
export const getXpForNextHabitLevel = (level: number): number => {
  if (level <= 0) return 50;
  return Math.round(50 * Math.pow(1.5, level - 1));
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
 * Calculates how much XP is earned for a single completion.
 * Balanced for Simple Tasks:
 * - 1 Rep = 5 XP (since it takes ~3-5 seconds)
 * - 1 Second = 1 XP
 */
export const getXpGainForTask = (type: 'count' | 'time', value: number): number => {
  const multiplier = type === 'count' ? 5 : 1;
  return value * multiplier;
};

/**
 * Calculates how much XP is earned for a habit completion.
 * Scales with the value (minutes or reps).
 */
export const getXpGainPerCompletion = (value: number, isBonus: boolean = false): number => {
  // For habits, 1 unit (min/rep) = 1 XP. 
  // Bonus sessions (already completed today) give 50% XP.
  const multiplier = isBonus ? 0.5 : 1;
  return value * multiplier;
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