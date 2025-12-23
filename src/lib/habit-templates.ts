import { Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill, Target, Heart, Zap, Anchor, ShieldCheck, FlaskConical, Calendar, Clock, Layers, Settings, Brain, TrendingUp, Smile, Lightbulb } from 'lucide-react';
import { HabitCategory, MeasurementType } from '@/types/habit';

export interface HabitTemplate {
  id: string;
  name: string;
  category: HabitCategory;
  defaultFrequency: number;
  defaultDuration: number;
  defaultMode: 'Trial' | 'Growth' | 'Fixed';
  defaultChunks: number;
  autoChunking: boolean;
  anchorPractice: boolean;
  unit: 'min' | 'reps' | 'dose';
  measurement_type: MeasurementType; // Added
  xpPerUnit: number;
  energyCostPerUnit: number;
  icon_name: string;
  plateauDaysRequired: number;
  shortDescription: string;
}

export const habitTemplates: HabitTemplate[] = [
  {
    id: "study_generic",
    name: "Study / Learning",
    category: "cognitive",
    defaultFrequency: 3,
    defaultDuration: 20,
    defaultMode: "Trial",
    defaultChunks: 1,
    autoChunking: true,
    anchorPractice: false,
    unit: "min",
    measurement_type: "timer",
    xpPerUnit: 42,
    energyCostPerUnit: 9,
    icon_name: "BookOpen",
    plateauDaysRequired: 7,
    shortDescription: "Boost your knowledge and cognitive skills.",
  },
  {
    id: "exercise_generic",
    name: "Exercise / Movement",
    category: "physical",
    defaultFrequency: 4,
    defaultDuration: 30,
    defaultMode: "Trial",
    defaultChunks: 1,
    autoChunking: true,
    anchorPractice: false,
    unit: "min",
    measurement_type: "timer",
    xpPerUnit: 30,
    energyCostPerUnit: 6,
    icon_name: "Dumbbell",
    plateauDaysRequired: 7,
    shortDescription: "Improve physical fitness and energy levels.",
  },
  {
    id: "mindfulness_generic",
    name: "Mindfulness / Meditation",
    category: "wellness",
    defaultFrequency: 5,
    defaultDuration: 10,
    defaultMode: "Trial",
    defaultChunks: 1,
    autoChunking: true,
    anchorPractice: true,
    unit: "min",
    measurement_type: "timer",
    xpPerUnit: 30,
    energyCostPerUnit: 6,
    icon_name: "Wind",
    plateauDaysRequired: 7,
    shortDescription: "Cultivate calm and mental clarity.",
  },
  {
    id: "creative_practice_generic",
    name: "Creative Practice",
    category: "cognitive",
    defaultFrequency: 3,
    defaultDuration: 15,
    defaultMode: "Trial",
    defaultChunks: 1,
    autoChunking: true,
    anchorPractice: false,
    unit: "min",
    measurement_type: "timer",
    xpPerUnit: 36,
    energyCostPerUnit: 7.2,
    icon_name: "Music",
    plateauDaysRequired: 7,
    shortDescription: "Nurture your artistic and innovative side.",
  },
  {
    id: "daily_task_generic",
    name: "Daily Task",
    category: "daily",
    defaultFrequency: 7,
    defaultDuration: 10,
    defaultMode: "Trial",
    defaultChunks: 1,
    autoChunking: true,
    anchorPractice: false,
    unit: "min",
    measurement_type: "timer",
    xpPerUnit: 24,
    energyCostPerUnit: 4.8,
    icon_name: "Home",
    plateauDaysRequired: 7,
    shortDescription: "Stay on top of essential daily chores.",
  },
  {
    id: "fixed_medication",
    name: "Take Medication",
    category: "wellness",
    defaultFrequency: 7,
    defaultDuration: 1,
    defaultMode: "Fixed",
    defaultChunks: 1,
    autoChunking: false,
    anchorPractice: true,
    unit: "dose",
    measurement_type: "binary",
    xpPerUnit: 10,
    energyCostPerUnit: 0,
    icon_name: "Pill",
    plateauDaysRequired: 7,
    shortDescription: "Ensure consistent medication adherence.",
  },
  {
    id: "fixed_teeth_brushing",
    name: "Brush Teeth",
    category: "daily",
    defaultFrequency: 7,
    defaultDuration: 2,
    defaultMode: "Fixed",
    defaultChunks: 1,
    autoChunking: false,
    anchorPractice: true,
    unit: "min",
    measurement_type: "timer",
    xpPerUnit: 5,
    energyCostPerUnit: 0,
    icon_name: "Sparkles",
    plateauDaysRequired: 7,
    shortDescription: "Maintain oral hygiene daily.",
  },
  {
    id: "pushups_template",
    name: "Push-ups",
    category: "physical",
    defaultFrequency: 3,
    defaultDuration: 10,
    defaultMode: "Growth",
    defaultChunks: 1,
    autoChunking: true,
    anchorPractice: false,
    unit: "reps",
    measurement_type: "unit",
    xpPerUnit: 1,
    energyCostPerUnit: 0.5,
    icon_name: "Dumbbell",
    plateauDaysRequired: 7,
    shortDescription: "Build core and upper body strength.",
  },
  {
    id: "custom_habit",
    name: "Create Custom Habit",
    category: "daily",
    defaultFrequency: 3,
    defaultDuration: 15,
    defaultMode: "Trial",
    defaultChunks: 1,
    autoChunking: true,
    anchorPractice: false,
    unit: "min",
    measurement_type: "timer",
    xpPerUnit: 30,
    energyCostPerUnit: 6,
    icon_name: "Target",
    plateauDaysRequired: 7,
    shortDescription: "Design a habit tailored to your unique needs.",
  },
];

export const habitCategories: { value: HabitCategory; label: string; icon: React.ElementType; icon_name: string }[] = [
  { value: 'cognitive', label: 'Cognitive', icon: BookOpen, icon_name: 'BookOpen' },
  { value: 'physical', label: 'Physical', icon: Dumbbell, icon_name: 'Dumbbell' },
  { value: 'wellness', label: 'Wellness', icon: Wind, icon_name: 'Wind' },
  { value: 'daily', label: 'Daily Task', icon: Home, icon_name: 'Home' },
  { value: 'anchor', label: 'Anchor Practice', icon: Anchor, icon_name: 'Anchor' },
];

export const habitUnits: { value: 'min' | 'reps' | 'dose'; label: string }[] = [
  { value: 'min', label: 'Minutes' },
  { value: 'reps', label: 'Reps' },
  { value: 'dose', label: 'Dose' },
];

export const habitMeasurementTypes: { value: MeasurementType; label: string; description: string }[] = [
  { value: 'timer', label: 'Timer', description: 'Log time spent using a stopwatch.' },
  { value: 'unit', label: 'Manual Entry', description: 'Enter a specific count (e.g., 20 reps).' },
  { value: 'binary', label: 'Simple Check', description: 'Just mark as done/undone.' },
];

export const habitModes: { value: 'Trial' | 'Growth' | 'Fixed'; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'Trial', label: 'Trial Phase', icon: FlaskConical, description: 'Focus on entry-level consistency. No growth pressure.' },
  { value: 'Growth', label: 'Adaptive Growth', icon: Zap, description: 'Adaptive scaling based on your weekly momentum.' },
  { value: 'Fixed', label: 'Fixed (Maintenance)', icon: ShieldCheck, description: 'Stable maintenance. Goals stay exactly where they are.' },
];

export const habitIcons: { value: string; label: string; icon: React.ElementType }[] = [
  { value: 'Dumbbell', label: 'Dumbbell', icon: Dumbbell },
  { value: 'Wind', label: 'Wind', icon: Wind },
  { value: 'BookOpen', label: 'Book', icon: BookOpen },
  { value: 'Music', label: 'Music', icon: Music },
  { value: 'Home', label: 'Home', icon: Home },
  { value: 'Code', label: 'Code', icon: Code },
  { value: 'Sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'Pill', label: 'Pill', icon: Pill },
  { value: 'Target', label: 'Target', icon: Target },
  { value: 'Heart', label: 'Heart', icon: Heart },
  { value: 'Zap', label: 'Zap', icon: Zap },
  { value: 'Anchor', label: 'Anchor', icon: Anchor },
  { value: 'FlaskConical', label: 'Flask', icon: FlaskConical },
  { value: 'ShieldCheck', label: 'Shield', icon: ShieldCheck },
  { value: 'Calendar', label: 'Calendar', icon: Calendar },
  { value: 'Clock', label: 'Clock', icon: Clock },
  { value: 'Layers', label: 'Layers', icon: Layers },
  { value: 'Settings', label: 'Settings', icon: Settings },
  { value: 'Brain', label: 'Brain', icon: Brain },
  { value: 'TrendingUp', label: 'Trending Up', icon: TrendingUp },
  { value: 'Smile', label: 'Smile', icon: Smile },
  { value: 'Lightbulb', label: 'Lightbulb', icon: Lightbulb },
];

export const motivationTypes: { value: string; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'stress_reduction', label: 'Stress Reduction', icon: Wind, description: 'To find calm and manage daily pressures.' },
  { value: 'skill_development', label: 'Skill Development', icon: BookOpen, description: 'To learn something new or improve an existing skill.' },
  { value: 'health_improvement', label: 'Health Improvement', icon: Dumbbell, description: 'To boost physical or mental well-being.' },
  { value: 'routine_building', label: 'Routine Building', icon: Home, description: 'To establish a consistent daily structure.' },
  { value: 'personal_growth', label: 'Personal Growth', icon: TrendingUp, description: 'To challenge myself and grow as a person.' },
  { value: 'creative_expression', label: 'Creative Expression', icon: Music, description: 'To explore my creativity and artistic side.' },
];