export type HabitType = 'count' | 'time';
export type MomentumLevel = 'Struggling' | 'Building' | 'Strong' | 'Crushing';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  targetGoal: number; // The current adaptive goal (e.g., 10 pushups, 5 minutes)
  unit: string; // e.g., "reps", "minutes"
  currentProgress: number;
  momentum: MomentumLevel;
  route: string; // Route for the dedicated logging screen
  xpPerUnit: number; // XP earned per unit of progress
  energyCostPerUnit: number; // Energy cost per unit of progress
}

export interface PianoHabit extends Habit {
  targetSongs: string[];
  songsCompletedToday: string[];
}