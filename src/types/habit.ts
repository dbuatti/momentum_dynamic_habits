// Assuming this is your habit types file. Adjust path if different.
import { Database } from './supabase'; // Adjust path if different

export type Habit = Database['public']['Tables']['habits']['Row'];
export type HabitLog = Database['public']['Tables']['habit_logs']['Row'];
export type CompletedTask = Database['public']['Tables']['completed_tasks']['Row'];
export type UserProfile = Database['public']['Tables']['profiles']['Row'];
export type HabitCapsuleDB = Database['public']['Tables']['habit_capsules']['Row'];
export type Badge = Database['public']['Tables']['badges']['Row'];
export type AchievedBadge = Database['public']['Tables']['achieved_badges']['Row'];
export type JourneyDay = Database['public']['Tables']['journey_days']['Row'];
export type UserTip = Database['public']['Tables']['user_tips']['Row'];

export interface ProcessedUserHabit extends Habit {
  dailyProgress: number;
  adjustedDailyGoal: number;
  isComplete: boolean;
  isLockedByDependency: boolean;
  raw_lifetime_progress: number; // Raw value for lifetime progress, e.g., seconds for time-based habits
  lifetime_progress: number; // UI-friendly value for lifetime progress, e.g., minutes for time-based habits
  isScheduledForToday: boolean; // Added this property
  isWithinWindow: boolean; // Added this property
  unit: 'min' | 'reps' | 'dose'; // Stricter typing for unit
}

export interface HabitLogEntry {
  id: string;
  habit_id: string;
  value: number;
  logged_at: string;
  note?: string;
}

export interface DailySummary {
  date: string;
  total_completed_tasks: number;
  total_xp_earned: number;
}

export interface WeeklySummary {
  [key: string]: DailySummary; // Key is date string (YYYY-MM-DD)
}

export interface HabitPatterns {
  streak: number;
  bestTime: string;
  consistencyScore: number;
}

export interface DashboardData {
  daysActive: number;
  totalJourneyDays: number;
  habits: ProcessedUserHabit[];
  neurodivergentMode: boolean;
  weeklySummary: WeeklySummary;
  patterns: HabitPatterns;
  lastActiveText: string;
  firstName: string;
  lastName: string;
  xp: number;
  level: number;
  tip: UserTip | null;
  averageDailyTasks: number;
}

export interface JourneyData {
  allBadges: Badge[];
  achievedBadges: AchievedBadge[];
  journeyDays: JourneyDay[];
}

export interface LogHabitParams {
  habitKey: string;
  value: number;
  taskName: string;
  note?: string;
}

export interface UnlogHabitParams {
  habitKey: string;
  taskName: string;
}