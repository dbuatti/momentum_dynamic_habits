import { Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill, Target, Heart, Zap, Anchor, ShieldCheck, FlaskConical, Calendar, Clock, Layers, Settings } from 'lucide-react'; // Added Calendar, Clock, Layers, Settings
import { HabitCategory } from '@/types/habit'; // Import HabitCategory

export interface HabitTemplate {
  id: string;
  name: string;
  category: HabitCategory;
  defaultFrequency: number;
  defaultDuration: number; // in minutes or reps/doses
  defaultMode: 'Trial' | 'Growth' | 'Fixed';
  defaultChunks: number;
  autoChunking: boolean;
  anchorPractice: boolean; // New property
  unit: 'min' | 'reps' | 'dose';
  xpPerUnit: number;
  energyCostPerUnit: number;
  icon_name: string; // Changed to string to store icon name
  plateauDaysRequired: number; // New property
  shortDescription: string; // Added shortDescription
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
    anchorPractice: true, // Often an anchor practice
    unit: "min",
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
    defaultDuration: 1, // 1 dose
    defaultMode: "Fixed",
    defaultChunks: 1,
    autoChunking: false,
    anchorPractice: true, // Often an anchor practice
    unit: "dose",
    xpPerUnit: 10,
    energyCostPerUnit: 0,
    icon_name: "Pill",
    plateauDaysRequired: 7, // Fixed habits still track consistency
    shortDescription: "Ensure consistent medication adherence.",
  },
  {
    id: "fixed_teeth_brushing",
    name: "Brush Teeth",
    category: "daily",
    defaultFrequency: 7,
    defaultDuration: 2, // 2 minutes
    defaultMode: "Fixed",
    defaultChunks: 1,
    autoChunking: false,
    anchorPractice: true, // Often an anchor practice
    unit: "min",
    xpPerUnit: 5,
    energyCostPerUnit: 0,
    icon_name: "Sparkles",
    plateauDaysRequired: 7, // Fixed habits still track consistency
    shortDescription: "Maintain oral hygiene daily.",
  },
  {
    id: "custom_habit",
    name: "Create Custom Habit",
    category: "daily", // Default category for custom
    defaultFrequency: 3,
    defaultDuration: 15,
    defaultMode: "Trial",
    defaultChunks: 1,
    autoChunking: true,
    anchorPractice: false,
    unit: "min",
    xpPerUnit: 30,
    energyCostPerUnit: 6,
    icon_name: "Target",
    plateauDaysRequired: 7, // Default for custom trial
    shortDescription: "Design a habit tailored to your unique needs.",
  },
];

export const habitCategories: { value: HabitCategory; label: string; icon: React.ElementType }[] = [
  { value: 'cognitive', label: 'Cognitive', icon: BookOpen },
  { value: 'physical', label: 'Physical', icon: Dumbbell },
  { value: 'wellness', label: 'Wellness', icon: Wind },
  { value: 'daily', label: 'Daily Task', icon: Home },
  { value: 'anchor', label: 'Anchor Practice', icon: Anchor },
];

export const habitUnits: { value: 'min' | 'reps' | 'dose'; label: string }[] = [
  { value: 'min', label: 'Minutes' },
  { value: 'reps', label: 'Reps' },
  { value: 'dose', label: 'Dose' },
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
];