import { Habit } from '@/types/habit';

export const calculateDailyParts = (habits: any[]) => {
  let totalParts = 0;
  let completedParts = 0;

  habits.forEach(habit => {
    const goal = habit.dailyGoal;
    const progress = habit.dailyProgress;
    const isReps = habit.unit === 'reps';
    const isMinutes = habit.unit === 'min';

    let numCapsules = 1;
    let capsuleValue = goal;

    // For pushups, keep the small set logic as it supports the physical nature of reps
    if (habit.key === 'pushups' && isReps) {
      const idealSetSize = Math.min(7, Math.max(5, Math.ceil(goal / 4)));
      numCapsules = Math.max(1, Math.ceil(goal / idealSetSize));
      capsuleValue = idealSetSize;
    } else if (isMinutes) {
      // Simplified Logic: Only split into parts if duration is at least 60 minutes.
      // This ensures 30m Housework, 10m Piano, etc., stay as single, binary sessions (0/1).
      if (goal >= 60) {
        numCapsules = 4;
      } else {
        numCapsules = 1;
      }
      
      capsuleValue = Math.ceil(goal / numCapsules);
    }

    totalParts += numCapsules;
    
    // Calculate completed parts for this habit
    for (let i = 0; i < numCapsules; i++) {
      const cumulativeNeeded = (i + 1) * capsuleValue;
      const isLast = i === numCapsules - 1;
      // Ensure we check against the actual goal for the last capsule to handle rounding
      if (progress >= (isLast ? goal : cumulativeNeeded)) {
        completedParts++;
      }
    }
  });

  return { completed: completedParts, total: totalParts };
};