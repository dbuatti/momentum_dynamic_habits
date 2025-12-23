import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Theme-aware utility for habit colors
 * Returns the appropriate CSS variable classes for habit theming
 */
export function getHabitColorClasses(habitKey: string, isDark: boolean = false): {
  bg: string;
  border: string;
  text: string;
  iconBg: string;
  wave: string;
} {
  const colorMap: Record<string, {
    light: { bg: string; border: string; text: string; iconBg: string; wave: string };
    dark: { bg: string; border: string; text: string; iconBg: string; wave: string };
  }> = {
    pushups: {
      light: { bg: 'bg-[hsl(var(--habit-orange))]', border: 'border-[hsl(var(--habit-orange-border))]', text: 'text-[hsl(var(--habit-orange-foreground))]', iconBg: 'bg-[hsl(var(--habit-orange))]/20', wave: 'hsl(var(--habit-orange-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-orange))]', border: 'border-[hsl(var(--habit-orange-border))]', text: 'text-[hsl(var(--habit-orange-foreground))]', iconBg: 'bg-[hsl(var(--habit-orange))]/20', wave: 'hsl(var(--habit-orange-foreground))' }
    },
    meditation: {
      light: { bg: 'bg-[hsl(var(--habit-blue))]', border: 'border-[hsl(var(--habit-blue-border))]', text: 'text-[hsl(var(--habit-blue-foreground))]', iconBg: 'bg-[hsl(var(--habit-blue))]/20', wave: 'hsl(var(--habit-blue-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-blue))]', border: 'border-[hsl(var(--habit-blue-border))]', text: 'text-[hsl(var(--habit-blue-foreground))]', iconBg: 'bg-[hsl(var(--habit-blue))]/20', wave: 'hsl(var(--habit-blue-foreground))' }
    },
    kinesiology: {
      light: { bg: 'bg-[hsl(var(--habit-green))]', border: 'border-[hsl(var(--habit-green-border))]', text: 'text-[hsl(var(--habit-green-foreground))]', iconBg: 'bg-[hsl(var(--habit-green))]/20', wave: 'hsl(var(--habit-green-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-green))]', border: 'border-[hsl(var(--habit-green-border))]', text: 'text-[hsl(var(--habit-green-foreground))]', iconBg: 'bg-[hsl(var(--habit-green))]/20', wave: 'hsl(var(--habit-green-foreground))' }
    },
    piano: {
      light: { bg: 'bg-[hsl(var(--habit-purple))]', border: 'border-[hsl(var(--habit-purple-border))]', text: 'text-[hsl(var(--habit-purple-foreground))]', iconBg: 'bg-[hsl(var(--habit-purple))]/20', wave: 'hsl(var(--habit-purple-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-purple))]', border: 'border-[hsl(var(--habit-purple-border))]', text: 'text-[hsl(var(--habit-purple-foreground))]', iconBg: 'bg-[hsl(var(--habit-purple))]/20', wave: 'hsl(var(--habit-purple-foreground))' }
    },
    housework: {
      light: { bg: 'bg-[hsl(var(--habit-red))]', border: 'border-[hsl(var(--habit-red-border))]', text: 'text-[hsl(var(--habit-red-foreground))]', iconBg: 'bg-[hsl(var(--habit-red))]/20', wave: 'hsl(var(--habit-red-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-red))]', border: 'border-[hsl(var(--habit-red-border))]', text: 'text-[hsl(var(--habit-red-foreground))]', iconBg: 'bg-[hsl(var(--habit-red))]/20', wave: 'hsl(var(--habit-red-foreground))' }
    },
    projectwork: {
      light: { bg: 'bg-[hsl(var(--habit-indigo))]', border: 'border-[hsl(var(--habit-indigo-border))]', text: 'text-[hsl(var(--habit-indigo-foreground))]', iconBg: 'bg-[hsl(var(--habit-indigo))]/20', wave: 'hsl(var(--habit-indigo-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-indigo))]', border: 'border-[hsl(var(--habit-indigo-border))]', text: 'text-[hsl(var(--habit-indigo-foreground))]', iconBg: 'bg-[hsl(var(--habit-indigo))]/20', wave: 'hsl(var(--habit-indigo-foreground))' }
    },
    teeth_brushing: {
      light: { bg: 'bg-[hsl(var(--habit-blue))]', border: 'border-[hsl(var(--habit-blue-border))]', text: 'text-[hsl(var(--habit-blue-foreground))]', iconBg: 'bg-[hsl(var(--habit-blue))]/20', wave: 'hsl(var(--habit-blue-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-blue))]', border: 'border-[hsl(var(--habit-blue-border))]', text: 'text-[hsl(var(--habit-blue-foreground))]', iconBg: 'bg-[hsl(var(--habit-blue))]/20', wave: 'hsl(var(--habit-blue-foreground))' }
    },
    medication: {
      light: { bg: 'bg-[hsl(var(--habit-purple))]', border: 'border-[hsl(var(--habit-purple-border))]', text: 'text-[hsl(var(--habit-purple-foreground))]', iconBg: 'bg-[hsl(var(--habit-purple))]/20', wave: 'hsl(var(--habit-purple-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-purple))]', border: 'border-[hsl(var(--habit-purple-border))]', text: 'text-[hsl(var(--habit-purple-foreground))]', iconBg: 'bg-[hsl(var(--habit-purple))]/20', wave: 'hsl(var(--habit-purple-foreground))' }
    },
    study_generic: {
      light: { bg: 'bg-[hsl(var(--habit-green))]', border: 'border-[hsl(var(--habit-green-border))]', text: 'text-[hsl(var(--habit-green-foreground))]', iconBg: 'bg-[hsl(var(--habit-green))]/20', wave: 'hsl(var(--habit-green-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-green))]', border: 'border-[hsl(var(--habit-green-border))]', text: 'text-[hsl(var(--habit-green-foreground))]', iconBg: 'bg-[hsl(var(--habit-green))]/20', wave: 'hsl(var(--habit-green-foreground))' }
    },
    exercise_generic: {
      light: { bg: 'bg-[hsl(var(--habit-orange))]', border: 'border-[hsl(var(--habit-orange-border))]', text: 'text-[hsl(var(--habit-orange-foreground))]', iconBg: 'bg-[hsl(var(--habit-orange))]/20', wave: 'hsl(var(--habit-orange-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-orange))]', border: 'border-[hsl(var(--habit-orange-border))]', text: 'text-[hsl(var(--habit-orange-foreground))]', iconBg: 'bg-[hsl(var(--habit-orange))]/20', wave: 'hsl(var(--habit-orange-foreground))' }
    },
    mindfulness_generic: {
      light: { bg: 'bg-[hsl(var(--habit-blue))]', border: 'border-[hsl(var(--habit-blue-border))]', text: 'text-[hsl(var(--habit-blue-foreground))]', iconBg: 'bg-[hsl(var(--habit-blue))]/20', wave: 'hsl(var(--habit-blue-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-blue))]', border: 'border-[hsl(var(--habit-blue-border))]', text: 'text-[hsl(var(--habit-blue-foreground))]', iconBg: 'bg-[hsl(var(--habit-blue))]/20', wave: 'hsl(var(--habit-blue-foreground))' }
    },
    creative_practice_generic: {
      light: { bg: 'bg-[hsl(var(--habit-purple))]', border: 'border-[hsl(var(--habit-purple-border))]', text: 'text-[hsl(var(--habit-purple-foreground))]', iconBg: 'bg-[hsl(var(--habit-purple))]/20', wave: 'hsl(var(--habit-purple-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-purple))]', border: 'border-[hsl(var(--habit-purple-border))]', text: 'text-[hsl(var(--habit-purple-foreground))]', iconBg: 'bg-[hsl(var(--habit-purple))]/20', wave: 'hsl(var(--habit-purple-foreground))' }
    },
    daily_task_generic: {
      light: { bg: 'bg-[hsl(var(--habit-red))]', border: 'border-[hsl(var(--habit-red-border))]', text: 'text-[hsl(var(--habit-red-foreground))]', iconBg: 'bg-[hsl(var(--habit-red))]/20', wave: 'hsl(var(--habit-red-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-red))]', border: 'border-[hsl(var(--habit-red-border))]', text: 'text-[hsl(var(--habit-red-foreground))]', iconBg: 'bg-[hsl(var(--habit-red))]/20', wave: 'hsl(var(--habit-red-foreground))' }
    },
    fixed_medication: {
      light: { bg: 'bg-[hsl(var(--habit-purple))]', border: 'border-[hsl(var(--habit-purple-border))]', text: 'text-[hsl(var(--habit-purple-foreground))]', iconBg: 'bg-[hsl(var(--habit-purple))]/20', wave: 'hsl(var(--habit-purple-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-purple))]', border: 'border-[hsl(var(--habit-purple-border))]', text: 'text-[hsl(var(--habit-purple-foreground))]', iconBg: 'bg-[hsl(var(--habit-purple))]/20', wave: 'hsl(var(--habit-purple-foreground))' }
    },
    fixed_teeth_brushing: {
      light: { bg: 'bg-[hsl(var(--habit-blue))]', border: 'border-[hsl(var(--habit-blue-border))]', text: 'text-[hsl(var(--habit-blue-foreground))]', iconBg: 'bg-[hsl(var(--habit-blue))]/20', wave: 'hsl(var(--habit-blue-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-blue))]', border: 'border-[hsl(var(--habit-blue-border))]', text: 'text-[hsl(var(--habit-blue-foreground))]', iconBg: 'bg-[hsl(var(--habit-blue))]/20', wave: 'hsl(var(--habit-blue-foreground))' }
    },
    custom_habit: {
      light: { bg: 'bg-[hsl(var(--habit-indigo))]', border: 'border-[hsl(var(--habit-indigo-border))]', text: 'text-[hsl(var(--habit-indigo-foreground))]', iconBg: 'bg-[hsl(var(--habit-indigo))]/20', wave: 'hsl(var(--habit-indigo-foreground))' },
      dark: { bg: 'bg-[hsl(var(--habit-indigo))]', border: 'border-[hsl(var(--habit-indigo-border))]', text: 'text-[hsl(var(--habit-indigo-foreground))]', iconBg: 'bg-[hsl(var(--habit-indigo))]/20', wave: 'hsl(var(--habit-indigo-foreground))' }
    },
  };

  const colors = colorMap[habitKey] || colorMap.custom_habit;
  return isDark ? colors.dark : colors.light;
}

/**
 * Get theme-aware gradient classes for habit capsules
 */
export function getHabitGradientClasses(habitKey: string, isDark: boolean = false): {
  from: string;
  to: string;
} {
  const gradientMap: Record<string, {
    light: { from: string; to: string };
    dark: { from: string; to: string };
  }> = {
    pushups: {
      light: { from: 'from-orange-300', to: 'to-orange-600' },
      dark: { from: 'from-orange-700', to: 'to-orange-900' }
    },
    meditation: {
      light: { from: 'from-blue-300', to: 'to-blue-600' },
      dark: { from: 'from-blue-700', to: 'to-blue-900' }
    },
    kinesiology: {
      light: { from: 'from-green-300', to: 'to-green-600' },
      dark: { from: 'from-green-700', to: 'to-green-900' }
    },
    piano: {
      light: { from: 'from-purple-300', to: 'to-purple-600' },
      dark: { from: 'from-purple-700', to: 'to-purple-900' }
    },
    housework: {
      light: { from: 'from-red-300', to: 'to-red-600' },
      dark: { from: 'from-red-700', to: 'to-red-900' }
    },
    projectwork: {
      light: { from: 'from-indigo-300', to: 'to-indigo-600' },
      dark: { from: 'from-indigo-700', to: 'to-indigo-900' }
    },
    teeth_brushing: {
      light: { from: 'from-blue-300', to: 'to-blue-600' },
      dark: { from: 'from-blue-700', to: 'to-blue-900' }
    },
    medication: {
      light: { from: 'from-purple-300', to: 'to-purple-600' },
      dark: { from: 'from-purple-700', to: 'to-purple-900' }
    },
    study_generic: {
      light: { from: 'from-green-300', to: 'to-green-600' },
      dark: { from: 'from-green-700', to: 'to-green-900' }
    },
    exercise_generic: {
      light: { from: 'from-orange-300', to: 'to-orange-600' },
      dark: { from: 'from-orange-700', to: 'to-orange-900' }
    },
    mindfulness_generic: {
      light: { from: 'from-blue-300', to: 'to-blue-600' },
      dark: { from: 'from-blue-700', to: 'to-blue-900' }
    },
    creative_practice_generic: {
      light: { from: 'from-purple-300', to: 'to-purple-600' },
      dark: { from: 'from-purple-700', to: 'to-purple-900' }
    },
    daily_task_generic: {
      light: { from: 'from-red-300', to: 'to-red-600' },
      dark: { from: 'from-red-700', to: 'to-red-900' }
    },
    fixed_medication: {
      light: { from: 'from-purple-300', to: 'to-purple-600' },
      dark: { from: 'from-purple-700', to: 'to-purple-900' }
    },
    fixed_teeth_brushing: {
      light: { from: 'from-blue-300', to: 'to-blue-600' },
      dark: { from: 'from-blue-700', to: 'to-blue-900' }
    },
    custom_habit: {
      light: { from: 'from-indigo-300', to: 'to-indigo-600' },
      dark: { from: 'from-indigo-700', to: 'to-indigo-900' }
    },
  };

  const gradients = gradientMap[habitKey] || gradientMap.custom_habit;
  return isDark ? gradients.dark : gradients.light;
}