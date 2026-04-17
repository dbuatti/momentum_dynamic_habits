import { UserHabitRecord } from "@/types/habit";

/**
 * Calculates the XP required to reach the NEXT level from the current level.
 * Uses a gentler exponential curve suitable for effort-based points (minutes/reps).
 * Level 1 -> 2: 50 XP
 * Level 2 -> 3: 75 XP
 * Level 3 -> 4: 112 XP
 */
export const getXpForNextHabitLevel = (level: number): number => {
  if (level <= 0) return 50;
  
  // Base 50 XP, growing by 50% each level
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
 * Now scales directly with the value (minutes or reps).
 */
export const getXpGainPerCompletion = (value: number, isBonus: boolean = false): number => {
  // Every unit (1 min or 1 rep) grants 1 Mastery XP.
  // Bonus sessions grant 50% XP to encourage consistency over over-exertion.
  if (isBonus) return value * 0.5;
  return value;
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