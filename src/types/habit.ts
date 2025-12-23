export type HabitType = 'count' | 'time';
export type MomentumLevel = 'Struggling' | 'Building' | 'Strong' | 'Crushing';
export type HabitCategory = 'anchor' | 'daily';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  category: HabitCategory;
  targetGoal: number; 
  unit: string; 
  currentProgress: number;
  momentum: MomentumLevel;
  route: string;
  xpPerUnit: number;
  energyCostPerUnit: number;
}

export interface UserHabitRecord {
  id: string;
  user_id: string;
  habit_key: string;
  current_daily_goal: number;
  long_term_goal: number;
  momentum_level: MomentumLevel;
  lifetime_progress: number;
  target_completion_date: string;
  updated_at: string;
  last_goal_increase_date: string | null;
  is_frozen: boolean;
  max_goal_cap: number | null;
  last_plateau_start_date: string;
  plateau_days_required: number;
  completions_in_plateau: number;
  is_fixed: boolean;
  category: HabitCategory; // Added category field
}

export interface PianoHabit extends Habit {
  targetSongs: string[];
  songsCompletedToday: string[];
}