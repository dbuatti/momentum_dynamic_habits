import { Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill, Target } from 'lucide-react';
import React from 'react';

export const habitIconMap: Record<string, React.ElementType> = {
  pushups: Dumbbell,
  meditation: Wind,
  kinesiology: BookOpen,
  piano: Music,
  housework: Home,
  projectwork: Code,
  teeth_brushing: Sparkles,
  medication: Pill,
  study_generic: BookOpen,
  exercise_generic: Dumbbell,
  mindfulness_generic: Wind,
  creative_practice_generic: Music,
  daily_task_generic: Home,
  fixed_medication: Pill,
  fixed_teeth_brushing: Sparkles,
  custom_habit: Target,
};

export type HabitColor = 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo';
export const habitColorMap: Record<string, HabitColor> = {
  pushups: 'orange', meditation: 'blue', kinesiology: 'green', piano: 'purple',
  housework: 'red', projectwork: 'indigo', teeth_brushing: 'blue', medication: 'purple',
  study_generic: 'green', exercise_generic: 'orange', mindfulness_generic: 'blue',
  creative_practice_generic: 'purple', daily_task_generic: 'red',
  fixed_medication: 'purple', fixed_teeth_brushing: 'blue', custom_habit: 'indigo',
};