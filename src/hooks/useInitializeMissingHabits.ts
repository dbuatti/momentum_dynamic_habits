import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { habitTemplates } from '@/lib/habit-templates';
import { UserHabitRecord, HabitCategory } from '@/types/habit';
import { useSession } from '@/contexts/SessionContext'; // Added import

interface OnboardingHabitParams {
  numHabits: number;
  isFoundational: boolean;
  focusAreas: string[];
  isLowPressure: boolean;
  sessionDuration: 'short' | 'medium' | 'long';
  weeklyFrequency: number; // Added weeklyFrequency
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
    weeklyFrequency, // Use weeklyFrequency
    allowChunks,
    neurodivergentMode,
  } = params;

  const today = new Date();
  const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
  const oneYearDateString = oneYearFromNow.toISOString().split('T')[0];

  // Determine base duration based on preference and neurodivergent mode
  let baseDuration: number; // in minutes
  if (sessionDuration === 'short') baseDuration = neurodivergentMode ? 5 : 10;
  else if (sessionDuration === 'medium') baseDuration = neurodivergentMode ? 10 : 20;
  else baseDuration = neurodivergentMode ? 20 : 30;

  // Filter templates based on focus areas and foundational preference
  let availableTemplates = habitTemplates.filter(template => {
    if (template.id === 'custom_habit') return false; // Exclude custom habit template from auto-generation

    // If foundational routine is selected, prioritize anchor practices
    if (isFoundational) {
      return template.anchorPractice;
    }
    // Otherwise, include habits from selected focus areas
    return focusAreas.includes(template.category);
  });

  // If no templates match focus areas, or if foundational is selected but no anchor templates,
  // fallback to a general set of templates.
  if (availableTemplates.length === 0) {
    availableTemplates = habitTemplates.filter(template =>
      template.id !== 'custom_habit' &&
      ['daily', 'cognitive', 'physical', 'wellness'].includes(template.category)
    );
  }
  
  // Ensure unique templates if multiple categories are selected
  const uniqueTemplates = Array.from(new Map(availableTemplates.map(item => [item.id, item])).values());

  // Sort templates: Anchor practices first if foundational, then by category, then by name
  uniqueTemplates.sort((a, b) => {
    if (isFoundational) {
      if (a.anchorPractice && !b.anchorPractice) return -1;
      if (!a.anchorPractice && b.anchorPractice) return 1;
    }
    if (a.category < b.category) return -1;
    if (a.category > b.category) return 1;
    return a.name.localeCompare(b.name);
  });

  // Select a subset of templates based on numHabits
  const selectedTemplates = uniqueTemplates.slice(0, numHabits);

  const habitsToUpsert: Partial<UserHabitRecord>[] = selectedTemplates.map(template => {
    const isFixed = template.defaultMode === 'Fixed';
    const isTrial = isLowPressure || template.defaultMode === 'Trial';
    const category = isFoundational ? 'anchor' : template.category; // Override category if foundational

    // Adjust plateau days for neurodivergent mode in trial/growth
    let plateauDays = template.plateauDaysRequired;
    if (isTrial) {
      plateauDays = neurodivergentMode ? 14 : 7;
    } else if (!isFixed) { // For adaptive growth mode
      plateauDays = neurodivergentMode ? 10 : 5;
    }

    // Calculate daily goal based on template's unit and user's duration preference
    let currentDailyGoal = template.defaultDuration;
    if (template.unit === 'min') {
      currentDailyGoal = baseDuration;
    } else if (template.unit === 'reps' || template.unit === 'dose') {
      currentDailyGoal = template.defaultDuration || 1;
    }

    // Calculate chunking
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

    // Round integer values before upserting
    const roundedCurrentDailyGoal = Math.round(currentDailyGoal);
    const roundedFrequencyPerWeek = Math.round(weeklyFrequency);
    const roundedXpPerUnit = Math.round(template.xpPerUnit);
    const roundedPlateauDaysRequired = Math.round(plateauDays);
    const roundedNumChunks = Math.round(numChunks);

    return {
      user_id: userId,
      habit_key: template.id,
      name: template.name,
      unit: template.unit,
      xp_per_unit: roundedXpPerUnit, // Use rounded value
      energy_cost_per_unit: template.energyCostPerUnit,
      current_daily_goal: roundedCurrentDailyGoal, // Use rounded value
      long_term_goal: Math.round(currentDailyGoal * (template.unit === 'min' ? 365 * 60 : 365)), // Ensure this is rounded
      momentum_level: 'Building',
      lifetime_progress: 0,
      last_goal_increase_date: today.toISOString().split('T')[0],
      is_frozen: false,
      max_goal_cap: null,
      last_plateau_start_date: today.toISOString().split('T')[0],
      plateau_days_required: roundedPlateauDaysRequired, // Use rounded value
      completions_in_plateau: 0,
      is_fixed: isFixed,
      category: category as HabitCategory,
      is_trial_mode: isTrial,
      frequency_per_week: roundedFrequencyPerWeek, // Use rounded value
      growth_phase: 'duration',
      window_start: null,
      window_end: null,
      days_of_week: [0, 1, 2, 3, 4, 5, 6],
      auto_chunking: shouldAutoChunk,
      enable_chunks: shouldAutoChunk,
      num_chunks: roundedNumChunks, // Use rounded value
      chunk_duration: chunkDuration,
      is_visible: true,
      dependent_on_habit_id: null,
      anchor_practice: template.anchorPractice, // Set anchor_practice from template
      carryover_value: 0, // Initialize carryover_value
    };
  });

  // Also include fixed habits like 'teeth_brushing' and 'medication' if they are not already selected
  const fixedHabitsToAdd = habitTemplates.filter(template =>
    template.defaultMode === 'Fixed' && !selectedTemplates.some(st => st.id === template.id)
  ).map(template => ({
    user_id: userId,
    habit_key: template.id,
    name: template.name,
    unit: template.unit,
    xp_per_unit: Math.round(template.xpPerUnit), // Ensure rounded
    energy_cost_per_unit: template.energyCostPerUnit,
    current_daily_goal: Math.round(template.defaultDuration), // Ensure rounded
    long_term_goal: Math.round(template.defaultDuration * (template.unit === 'min' ? 365 * 60 : 365)), // Ensure rounded
    target_completion_date: oneYearDateString,
    momentum_level: 'Building',
    lifetime_progress: 0,
    last_goal_increase_date: today.toISOString().split('T')[0],
    is_frozen: false,
    max_goal_cap: null,
    last_plateau_start_date: today.toISOString().split('T')[0],
    plateau_days_required: Math.round(template.plateauDaysRequired || 7), // Ensure rounded
    completions_in_plateau: 0,
    is_fixed: true,
    category: template.category as HabitCategory,
    is_trial_mode: false,
    frequency_per_week: Math.round(template.defaultFrequency), // Ensure rounded
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