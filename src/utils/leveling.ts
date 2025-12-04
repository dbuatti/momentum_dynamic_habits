export const getXpForNextLevel = (currentLevel: number): number => {
  // A simple leveling curve: XP_for_level_N = 50 * N * (N-1)
  // Level 1 requires 0 XP to start, next level (2) requires 100 XP
  // Level 2 requires 100 XP to reach, next level (3) requires 300 XP total
  // The XP needed *to reach* a specific level (N) is 50 * N * (N-1)
  // So, to find XP needed for the *next* level, we calculate XP for (currentLevel + 1)
  return 50 * (currentLevel + 1) * currentLevel;
};

export const getXpForCurrentLevelStart = (currentLevel: number): number => {
  if (currentLevel <= 1) return 0;
  return 50 * currentLevel * (currentLevel - 1);
};

export const calculateLevel = (xp: number): number => {
  let level = 1;
  while (true) {
    const xpForNextLevel = getXpForNextLevel(level);
    if (xp < xpForNextLevel) {
      return level;
    }
    level++;
  }
};