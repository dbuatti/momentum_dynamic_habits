import { Habit } from '@/types/habit';

/**
 * Calculates the suggested chunks for a habit based on goal and user preferences.
 * Logic:
 * - Time habits: Max 10-15 mins per chunk (smaller for neurodivergent)
 * - Count habits: Max 20-25 reps per chunk
 */
export const calculateDynamicChunks = (
  habitKey: string, 
  goal: number, 
  unit: string, 
  isNeurodivergent: boolean,
  autoChunking: boolean,
  manualNumChunks?: number,
  manualChunkDuration?: number
) => {
  // If manual chunking is explicitly enabled and auto is off, use manual settings
  if (!autoChunking && manualNumChunks && manualChunkDuration) {
    return {
      numChunks: manualNumChunks,
      chunkValue: manualChunkDuration
    };
  }

  const isTime = unit === 'min';
  const isReps = unit === 'reps';

  let numChunks = 1;
  let chunkValue = goal;

  if (isTime) {
    // For time, target ~10 min chunks, or ~5 min for neurodivergent
    const threshold = isNeurodivergent ? 5 : 10;
    if (goal > threshold) {
      numChunks = Math.ceil(goal / threshold);
      chunkValue = goal / numChunks;
    }
  } else if (isReps) {
    // For reps, target ~20 reps, or ~10 for neurodivergent
    const threshold = isNeurodivergent ? 10 : 20;
    if (goal > threshold) {
      numChunks = Math.ceil(goal / threshold);
      chunkValue = goal / numChunks;
    }
  }

  // Ensure minimums
  return {
    numChunks: Math.max(1, numChunks),
    chunkValue: Number(chunkValue.toFixed(1))
  };
};

export const calculateDailyParts = (habits: any[], isNeurodivergent: boolean) => {
  let totalParts = 0;
  let completedParts = 0;

  habits.forEach(habit => {
    const { numChunks, chunkValue } = calculateDynamicChunks(
      habit.key,
      habit.dailyGoal,
      habit.unit,
      isNeurodivergent,
      habit.auto_chunking,
      habit.num_chunks,
      habit.chunk_duration
    );

    totalParts += numChunks;
    
    // Calculate completed parts for this habit
    for (let i = 0; i < numChunks; i++) {
      const cumulativeNeeded = (i + 1) * chunkValue;
      const isLast = i === numChunks - 1;
      // Ensure we check against the actual goal for the last capsule to handle rounding
      if (habit.dailyProgress >= (isLast ? habit.dailyGoal : cumulativeNeeded)) {
        completedParts++;
      }
    }
  });

  return { completed: completedParts, total: totalParts };
};