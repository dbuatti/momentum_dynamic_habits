import { Habit } from '@/types/habit';

/**
 * Calculates the suggested chunks for a habit based on goal and user preferences.
 * Logic:
 * - Fixed binary habits: ALWAYS 1 chunk.
 * - Time habits: Max 10-15 mins per chunk (smaller for neurodivergent)
 * - Count habits: Max 20-25 reps per chunk
 */
export const calculateDynamicChunks = (
  habitKey: string, 
  goal: number, // This should be the adjustedDailyGoal
  unit: string, 
  isNeurodivergent: boolean,
  autoChunking: boolean,
  manualNumChunks?: number,
  manualChunkDuration?: number,
  isFixed?: boolean,
  measurementType?: string
) => {
  // HARD GUARDRAIL: Fixed habits with binary measurement (like medication)
  // should NEVER have more than 1 chunk/capsule.
  if (isFixed && measurementType === 'binary') {
    return {
      numChunks: 1,
      chunkValue: 1 // Binary is always 1 unit
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
      habit.num_chunks,
      habit.chunk_duration,
      habit.is_fixed,
      habit.measurement_type
    );

    totalParts += numChunks;
    
    // 2. Determine effective progress (Cap at target)
    // Formula: progressToday = min(loggedAmount, dailyTarget)
    const dailyTarget = habit.adjustedDailyGoal;
    let effectiveProgress = Math.min(habit.dailyProgress, dailyTarget);
    
    // Special handling for Fixed / Binary:
    // progressToday = completed ? 1 : 0
    if (habit.is_fixed && habit.measurement_type === 'binary') {
        effectiveProgress = habit.isComplete ? 1 : 0;
    }

    // 3. Calculate completed parts for this habit based on effective progress
    for (let i = 0; i < numChunks; i++) {
      const isLast = i === numChunks - 1;
      const cumulativeNeeded = isLast ? dailyTarget : (i + 1) * chunkValue;
      
      // Use a small epsilon for float comparison to avoid "0/2" logic errors
      if (effectiveProgress >= (cumulativeNeeded - 0.01)) {
        completedParts++;
      }
    }
  });

  return { completed: completedParts, total: totalParts };
};