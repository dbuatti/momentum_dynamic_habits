import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { habitTemplates } from '@/lib/habit-templates';
import { UserHabitRecord, HabitCategory, GrowthType } from '@/types/habit';
import { useSession } from '@/contexts/SessionContext';

interface OnboardingHabitParams {
  numHabits: number;
  isFoundational: boolean;
  focusAreas: string[];
  isLowPressure: boolean;
  sessionDuration: 'short' | 'medium' | 'long';
  weeklyFrequency: number;
  allowChunks: boolean;
  neurodivergentMode: boolean;
}

const initializeSelectedHabits = async (userId: string, params: OnboardingHabitParams) => {
  const {
    numHabits,
    isFoundational,
    focusAreas,
    isLowPressure,
    sessionDuration,
    weeklyFrequency,
    allowChunks,
    neurodivergentMode,
  } = params;

  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];

  let baseDuration: number;
  if (sessionDuration === 'short') baseDuration = neurodivergentMode ? 5 : 10;
  else if (sessionDuration === 'medium') baseDuration = neurodivergentMode ? 10 : 20;
  else baseDuration = neurodivergentMode ? 20 : 30;

  let availableTemplates = habitTemplates.filter(template => {
    if (template.id === 'custom_habit') return false;
    if (isFoundational) {
      return template.anchorPractice;
    }
    return focusAreas.includes(template.category);
  });

  if (availableTemplates.length === 0) {
    availableTemplates = habitTemplates.filter(template =>
      template.id !== 'custom_habit' &&
      ['daily', 'cognitive', 'physical', 'wellness'].includes(template.category)
    );
  }
  
  const uniqueTemplates = Array.from(new Map(availableTemplates.map(item => [item.id, item])).values());

  uniqueTemplates.sort((a, b) => {
    if (isFoundational) {
      if (a.anchorPractice && !b.anchorPractice) return -1;
      if (!a.anchorPractice && b.anchorPractice) return 1;
    }
    if (a.category < b.category) return -1;
    if (a.category > b.category) return 1;
    return a.name.localeCompare(b.name);
  });

  const selectedTemplates = uniqueTemplates.slice(0, numHabits);

  const habitsToUpsert: Partial<UserHabitRecord>[] = selectedTemplates.map(template => {
    const isFixed = template.defaultMode === 'Fixed';
    const isTrial = isLowPressure || template.defaultMode === 'Trial';
    const category = isFoundational ? 'anchor' : template.category;

    let plateauDays = template.plateauDaysRequired;
    if (isTrial) {
      plateauDays = neurodivergentMode ? 14 : 7;
    } else if (!isFixed) {
      plateauDays = neurodivergentMode ? 10 : 5;
    }

    let currentDailyGoal = template.defaultDuration;
    if (template.unit === 'min') {
      currentDailyGoal = baseDuration;
    } else if (template.unit === 'reps' || template.unit === 'dose') {
      currentDailyGoal = template.defaultDuration || 1;
    }

    // Determine default growth settings
    let growthType: GrowthType = 'fixed';
    let growthValue = 1;

    if (template.unit === 'min') {
      growthType = 'percentage';
      growthValue = neurodivergentMode ? 10 : 20;
    } else if (template.unit === 'reps') {
      growthType = 'fixed';
      growthValue = neurodivergentMode ? 1 : 2;
    }

    let numChunks = 1;
    let chunkDuration = currentDailyGoal;
    const shouldAutoChunk = allowChunks && template.autoChunking;

    if (shouldAutoChunk && template.unit === 'min' && currentDailyGoal > (neurodivergentMode ? 5 : 10)) {
      const targetChunkSize = neurodivergentMode ? 5 : 10;
      numChunks = Math.max(1, Math.ceil(currentDailyGoal / targetChunkSize));
      chunkDuration = Number((currentDailyGoal / numChunks).toFixed(1));
    } else if (shouldAutoChunk && template.unit === 'reps' && currentDailyGoal > (neurodivergentMode ? 10 : 20)) {
      const targetChunkSize = neurodivergentMode ? 10 : 20;
      numChunks = Math.max(1, Math.ceil(currentDailyGoal / targetChunkSize));
      chunkDuration = Number((currentDailyGoal / numChunks).toFixed(1));
    }

    // NEW: Weekly goal settings (disabled by default for onboarding)
    const weeklyGoalEnabled = false;
    const weeklyGoalTarget = currentDailyGoal * weeklyFrequency;
    const weeklyGoalUnit = template.unit;

    return {
      user_id: userId,
      habit_key: template.id,
      name: template.name,
      unit: template.unit,
      xp_per_unit: Math.round(template.xpPerUnit),
      energy_cost_per_unit: template.energyCostPerUnit,
      current_daily_goal: Math.round(currentDailyGoal),
      long_term_goal: Math.round(currentDailyGoal * (template.unit === 'min' ? 365 * 60 : 365)),
      momentum_level: 'Building',
      lifetime_progress: 0,
      last_goal_increase_date: today.toISOString().split('T')[0],
      is_frozen: false,
      max_goal_cap: null,
      last_plateau_start_date: today.toISOString().split('T')[0],
      plateau_days_required: Math.round(plateauDays),
      completions_in_plateau: 0,
      is_fixed: isFixed,
      category: category as HabitCategory,
      is_trial_mode: isTrial,
      frequency_per_week: Math.round(weeklyFrequency),
      growth_phase: 'duration',
      window_start: null,
      window_end: null,
      days_of_week: [0, 1, 2, 3, 4, 5, 6],
      auto_chunking: shouldAutoChunk,
      enable_chunks: shouldAutoChunk,
      num_chunks: Math.round(numChunks),
      chunk_duration: chunkDuration,
      is_visible: true,
      dependent_on_habit_id: null,
      anchor_practice: template.anchorPractice,
      carryover_value: 0,
      growth_type: growthType,
      growth_value: growthValue,
      // NEW: Weekly goal fields
      weekly_goal_enabled: weeklyGoalEnabled,
      weekly_goal_target: weeklyGoalTarget,
      weekly_goal_unit: weeklyGoalUnit,
    };
  });

  const fixedHabitsToAdd = habitTemplates.filter(template =>
    template.defaultMode === 'Fixed' && !selectedTemplates.some(st => st.id === template.id)
  ).map(template => ({
    user_id: userId,
    habit_key: template.id,
    name: template.name,
    unit: template.unit,
    xp_per_unit: Math.round(template.xpPerUnit),
    energy_cost_per_unit: template.energyCostPerUnit,
    current_daily_goal: Math.round(template.defaultDuration),
    long_term_goal: Math.round(template.defaultDuration * (template.unit === 'min' ? 365 * 60 : 365)),
    target_completion_date: oneYearDateString,
    momentum_level: 'Building',
    lifetime_progress: 0,
    last_goal_increase_date: today.toISOString().split('T')[0],
    is_frozen: false,
    max_goal_cap: null,
    last_plateau_start_date: today.toISOString().split('T')[0],
    plateau_days_required: Math.round(template.plateauDaysRequired || 7),
    completions_in_plateau: 0,
    is_fixed: true,
    category: template.category as HabitCategory,
    is_trial_mode: false,
    frequency_per_week: Math.round(template.defaultFrequency),
    growth_phase: 'duration',
    window_start: null,
    window_end: null,
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    auto_chunking: false,
    enable_chunks: false,
    num_chunks: 1,
    chunk_duration: template.defaultDuration,
    is_visible: true,
    dependent_on_habit_id: null,
    anchor_practice: template.anchorPractice,
    carryover_value: 0,
    growth_type: 'fixed' as GrowthType,
    growth_value: 0,
    // NEW: Weekly goal fields (disabled for fixed habits)
    weekly_goal_enabled: false,
    weekly_goal_target: 0,
    weekly_goal_unit: template.unit,
  }));

  const finalHabitsToUpsert = [...habitsToUpsert, ...fixedHabitsToAdd];

  if (finalHabitsToUpsert.length > 0) {
    const { error: upsertError } = await supabase
      .from('user_habits')
      .upsert(finalHabitsToUpsert);
    if (upsertError) throw upsertError;
  }

  return { initialized: finalHabitsToUpsert.length > 0, habits: finalHabitsToUpsert };
};

export const useInitializeMissingHabits = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: OnboardingHabitParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return initializeSelectedHabits(session.user.id, params);
    },
    onSuccess: (data) => {
      if (data.initialized) {
        queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] });
        queryClient.invalidateQueries({ queryKey: ['journeyData', session?.user?.id] });
      }
    },
    onError: (error) => {
      showError(`Failed to ensure habits exist: ${error.message}`);
    },
  });
};