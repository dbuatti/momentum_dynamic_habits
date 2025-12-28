export type HabitType = 'count' | 'time';
export type MomentumLevel = 'Struggling' | 'Building' | 'Strong' | 'Crushing';
export type HabitCategory = 'anchor' | 'daily' | 'cognitive' | 'physical' | 'wellness' | 'daily_task';
export type GrowthPhase = 'frequency' | 'duration';
export type MeasurementType = 'timer' | 'unit' | 'binary';
export type GrowthType = 'fixed' | 'percentage';
export type ChunkingMode = 'auto' | 'by_duration' | 'by_parts';

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
  name: string;
  unit: string;
  xp_per_unit: number;
  energy_cost_per_unit: number;
  current_daily_goal: number;
  long_term_goal: number;
  momentum_level: MomentumLevel;
  lifetime_progress: number;
  raw_lifetime_progress: number;
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
  dependent_on_habit_id: string | null;
  anchor_practice: boolean;
  carryover_value: number;
  measurement_type: MeasurementType;
  growth_type: GrowthType;
  growth_value: number;
  
  // New Chunking Control Fields
  chunking_mode: ChunkingMode;
  preferred_chunk_duration: number | null;
  preferred_chunk_count: number | null;
  
  // New Weekly Anchor Field
  weekly_session_min_duration: number;

  // NEW: Behavior settings
  complete_on_finish: boolean;
  is_weekly_goal: boolean;
}

export interface ProcessedUserHabit extends UserHabitRecord {
  key: string;
  dailyGoal: number;
  adjustedDailyGoal: number;
  dailyProgress: number;
  isComplete: boolean;
  weekly_completions: number;
  weekly_goal: number;
  weekly_progress: number; // New: Sessions completed this week
  xpPerUnit: number;
  energyCostPerUnit: number;
  growth_stats: {
    completions: number;
    required: number;
    daysRemaining: number;
    phase: 'frequency' | 'duration';
  };
  isLockedByDependency: boolean;
  carryoverValue: number;
  isWithinWindow: boolean;
  isScheduledForToday: boolean;
  capsuleTaskMapping: Record<number, string>;
}

export interface PianoHabit extends Habit {
  targetSongs: string[];
  songsCompletedToday: string[];
}