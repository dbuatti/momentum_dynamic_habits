// ... inside LevelProgressCard component
// ... inside progress calculation
const progressPercentage = xpNeededForNextLevel > 0 
  ? (xpProgressInCurrentLevel / xpNeededForNextLevel) * 100 
  : 0;
// ... rest of file