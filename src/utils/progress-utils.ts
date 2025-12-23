import { Habit } from '@/types/habit';

/**
 * Calculates the suggested chunks for a habit based on goal and user preferences.
 * Logic:
 * - Binary habits or disabled chunks: ALWAYS 1 chunk matching the goal.
 * - Time habits: Max 10-15 mins per chunk (smaller for neurodivergent)
 * - Count habits: Max 20-25 reps per chunk
 */
export const calculateDynamicChunks = (
  habitKey: string, 
  goal: number, // This should be the adjustedDailyGoal
  unit: string, 
  isNeurodivergent: boolean,
  autoChunking: boolean,
  enableChunks: boolean, // Parameter to respect the enable_chunks setting
  manualNumChunks?: number,
  manualChunkDuration?: number,
  measurementType?: string
) => {
  // HARD GUARDRAIL 1: Binary measurement (like medication) 
  // or explicitly disabled chunks should NEVER have more than 1 capsule.
  if (measurementType === 'binary' || !enableChunks) {
    return {
      numChunks: 1,
      chunkValue: goal
    };
  }

  // HARD GUARDRAIL 2: Tiny goals (e.g., 2 mins) shouldn't be chunked even if auto is on.
  const isTinyGoal = (unit === 'min' && goal <= 5) || (unit === 'reps' && goal <= 5);
  if (isTinyGoal) {
    return {
      numChunks: 1,
      chunkValue: goal
    };
  }

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
    // 1. Calculate chunks
    const { numChunks, chunkValue } = calculateDynamicChunks(
      habit.key,
      habit.adjustedDailyGoal,
      habit.unit,
      isNeurodivergent,
      habit.auto_chunking,
      habit.enable_chunks, // Pass the toggle
      habit.num_chunks,
      habit.chunk_duration,
      habit.measurement_type
    );

    totalParts += numChunks;
    
    // 2. Determine effective progress
    const dailyTarget = habit.adjustedDailyGoal;
    const rawProgress = habit.dailyProgress;
    
    // 3. Calculate completed parts for this habit based on raw progress
    for (let i = 0; i < numChunks; i++) {
      const isLast = i === numChunks - 1;
      const cumulativeNeeded = isLast ? dailyTarget : (i + 1) * chunkValue;
      
      if (rawProgress >= (cumulativeNeeded - 0.01)) {
        completedParts++;
      }
    }
  });

  return { completed: completedParts, total: totalParts };
};