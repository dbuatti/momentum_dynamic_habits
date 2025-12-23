export type HabitType = 'count' | 'time';
export type MomentumLevel = 'Struggling' | 'Building' | 'Strong' | 'Crushing';
export type HabitCategory = 'anchor' | 'daily' | 'cognitive' | 'physical' | 'wellness' | 'daily_task'; // Added new categories
export type GrowthPhase = 'frequency' | 'duration';

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
  name: string; // Added name
  unit: string; // Added unit
  xp_per_unit: number; // Added xp_per_unit
  energy_cost_per_unit: number; // Added energy_cost_per_unit
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
  category: HabitCategory;
  is_trial_mode: boolean;
  frequency_per_week: number;
  growth_phase: GrowthPhase;
  window_start: string | null;
  window_end: string | null;
  days_of_week: number[];
  auto_chunking: boolean;
  enable_chunks: boolean;
  num_chunks: number;
  chunk_duration: number;
  is_visible: boolean;
  dependent_on_habit_key: string | null; // Added this line
}

export interface PianoHabit extends Habit {
  targetSongs: string[];
  songsCompletedToday: string[];
}