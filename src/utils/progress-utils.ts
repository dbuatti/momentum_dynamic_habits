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

    if (habit.key === 'pushups' && isReps) {
      const idealSetSize = Math.min(7, Math.max(5, Math.ceil(goal / 4)));
      numCapsules = Math.max(1, Math.ceil(goal / idealSetSize));
      capsuleValue = idealSetSize;
    } else if (isMinutes) {
      if (goal >= 60) numCapsules = 4;
      else if (goal >= 45) numCapsules = 3;
      else if (goal >= 20) numCapsules = 2;
      else if (goal >= 10) numCapsules = 2;
      
      capsuleValue = Math.ceil(goal / numCapsules);
    }

    totalParts += numCapsules;
    
    // Calculate completed parts for this habit
    for (let i = 0; i < numCapsules; i++) {
      const cumulativeNeeded = (i + 1) * capsuleValue;
      const isLast = i === numCapsules - 1;
      if (progress >= cumulativeNeeded || (isLast && progress >= goal)) {
        completedParts++;
      }
    }
  });

  return { completed: completedParts, total: totalParts };
};