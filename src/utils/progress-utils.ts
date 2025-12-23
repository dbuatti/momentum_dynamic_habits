/**
 * Calculates the suggested chunks for a habit based on goal and user preferences.
 * Implements an emotionally intelligent heuristic that avoids visual overwhelm.
 */
export const calculateDynamicChunks = (
  habitKey: string, 
  goal: number, 
  unit: string, 
  isNeurodivergent: boolean,
  autoChunking: boolean, // Legacy field
  enableChunks: boolean, 
  manualNumChunks?: number, // Legacy field
  manualChunkDuration?: number, // Legacy field
  measurementType?: string,
  chunkingMode: string = 'auto',
  preferredDuration?: number | null,
  preferredCount?: number | null
) => {
  // HARD GUARDRAIL 1: Binary measurement (like medication) 
  // or explicitly disabled chunks should NEVER have more than 1 capsule.
  if (measurementType === 'binary' || !enableChunks) {
    return { numChunks: 1, chunkValue: goal };
  }

  // HARD GUARDRAIL 2: Tiny goals (e.g., <= 5 mins) shouldn't be chunked.
  if (goal <= 5) {
    return { numChunks: 1, chunkValue: goal };
  }

  // OPTION A: BY DURATION (analytical thinking)
  if (chunkingMode === 'by_duration' && preferredDuration && preferredDuration > 0) {
    const num = Math.ceil(goal / preferredDuration);
    return {
      numChunks: Math.max(1, num),
      chunkValue: preferredDuration
    };
  }

  // OPTION B: BY PARTS (emotion/step-based thinking)
  if (chunkingMode === 'by_parts' && preferredCount && preferredCount > 0) {
    return {
      numChunks: preferredCount,
      chunkValue: Number((goal / preferredCount).toFixed(1))
    };
  }

  // OPTION C: AUTO (Human-First Heuristic)
  let numChunks = 1;
  let chunkValue = goal;

  const isTime = unit === 'min';

  if (isTime) {
    // Avoid "To-Do Explosion": 60 mins -> 2 x 30m, not 12 x 5m
    if (goal <= 15) {
      numChunks = 1;
    } else if (goal <= 30) {
      numChunks = 2; // 15m chunks
    } else if (goal <= 60) {
      numChunks = 2; // 30m chunks (better focus blocks)
    } else if (goal <= 120) {
      numChunks = 3; // 40m chunks
    } else {
      numChunks = Math.ceil(goal / 30); // Default to 30m blocks for very long tasks
    }

    // ND Adjustment: If ND mode is on, we might want slightly smaller blocks,
    // but still avoid the 5-min fragmentation for cognitive tasks.
    if (isNeurodivergent && goal > 30) {
      numChunks = Math.ceil(goal / 20); // 20m chunks are often the ND sweet spot
    }
  } else {
    // For Count-based (Reps):
    if (goal <= 10) numChunks = 1;
    else if (goal <= 30) numChunks = 2;
    else numChunks = Math.ceil(goal / 20);
  }

  chunkValue = goal / numChunks;

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
      habit.adjustedDailyGoal,
      habit.unit,
      isNeurodivergent,
      habit.auto_chunking,
      habit.enable_chunks, 
      habit.num_chunks,
      habit.chunk_duration,
      habit.measurement_type,
      habit.chunking_mode,
      habit.preferred_chunk_duration,
      habit.preferred_chunk_count
    );

    totalParts += numChunks;
    
    const rawProgress = habit.dailyProgress;
    for (let i = 0; i < numChunks; i++) {
      const isLast = i === numChunks - 1;
      const cumulativeNeeded = isLast ? habit.adjustedDailyGoal : (i + 1) * chunkValue;
      if (rawProgress >= (cumulativeNeeded - 0.01)) {
        completedParts++;
      }
    }
  });

  return { completed: completedParts, total: totalParts };
};