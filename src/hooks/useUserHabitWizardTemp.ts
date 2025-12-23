"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';

// Define the structure for the wizard's habit data
export interface WizardHabitData {
  // Core Info
  name: string;
  habit_key: string;
  category: string;
  unit: 'min' | 'reps' | 'dose';
  icon_name: string;
  short_description: string;
  
  // Step 1 & 2 (Macro)
  motivation_type: 'stress_reduction' | 'skill_development' | 'health_improvement' | 'routine_building' | null;
  motivation_type_skipped?: boolean; // Added skipped flag

  // Step 3: Current Capacity (Micro)
  energy_per_session: 'very_little' | 'a_bit' | 'moderate' | 'plenty' | null;
  energy_per_session_skipped?: boolean; // Added skipped flag
  consistency_reality: '1-2_days' | '3-4_days' | 'most_days' | 'daily' | null;
  consistency_reality_skipped?: boolean; // Added skipped flag
  emotional_cost: 'light' | 'some_resistance' | 'heavy' | null;
  emotional_cost_skipped?: boolean; // Added skipped flag
  confidence_check: number | null; // 1-10
  confidence_check_skipped?: boolean; // Added skipped flag

  // Step 4: Barriers (Micro)
  barriers: string[]; // ['forgetting', 'time_pressure', 'overwhelm', 'perfectionism', 'mood', 'boredom']
  barriers_skipped?: boolean; // Added skipped flag
  missed_day_response: 'keep_going' | 'discouraged' | 'stop_completely' | null;
  missed_day_response_skipped?: boolean; // Added skipped flag
  sensitivity_setting: 'gentle' | 'neutral' | 'direct' | null;
  sensitivity_setting_skipped?: boolean; // Added skipped flag

  // Step 5: Timing & Dependencies (Micro)
  time_of_day_fit: 'morning' | 'midday' | 'afternoon' | 'evening' | 'anytime' | null; // Updated options
  time_of_day_fit_skipped?: boolean; // Added skipped flag
  dependency_check: 'after_waking' | 'after_work' | 'after_another_habit' | 'none' | null;
  dependency_check_skipped?: boolean; // Added skipped flag
  time_pressure_check: 'always' | 'only_if_time' | 'decide_later' | null;
  time_pressure_check_skipped?: boolean; // Added skipped flag

  // Step 6: Confidence & Growth (Micro)
  growth_appetite: 'auto' | 'suggest' | 'steady' | null;
  growth_appetite_skipped?: boolean; // Added skipped flag
  growth_style: 'duration' | 'frequency' | 'both' | null;
  growth_style_skipped?: boolean; // Added skipped flag
  failure_response: 'reduce' | 'pause' | 'ask' | null;
  failure_response_skipped?: boolean; // Added skipped flag
  success_definition: 'sometimes' | 'most_weeks' | 'automatic' | null;
  success_definition_skipped?: boolean; // Added skipped flag

  // Calculated/Inferred Fields (for final habit creation)
  daily_goal: number;
  frequency_per_week: number;
  is_trial_mode: boolean;
  is_fixed: boolean;
  anchor_practice: boolean;
  auto_chunking: boolean;
  xp_per_unit: number;
  energy_cost_per_unit: number;
  dependent_on_habit_id: string | null;
  plateau_days_required: number;
  window_start: string | null;
  window_end: string | null;
  carryover_enabled: boolean; // New field
  safety_net_choice_skipped?: boolean; // Added missing skipped flag
  
  // Additional fields for micro-step flow (these are temporary and not directly mapped to DB)
  timing_preference?: string; // This is the ID from timeOfDayOptions, not window_start/end
  flexibility?: 'strict' | 'flexible' | 'none';
  sequence_bias?: 'early' | 'after_core' | 'energy_based';
  soft_lock?: boolean;
  safety_net_choice?: 'none' | 'rollover' | 'gentle';
}

export interface UserHabitWizardTemp {
  id: string;
  user_id: string;
  current_step: number;
  habit_data: WizardHabitData;
  last_saved_at: string;
}

interface SaveWizardProgressParams {
  current_step: number;
  habit_data: Partial<WizardHabitData>;
}

const fetchWizardProgress = async (userId: string): Promise<UserHabitWizardTemp | null> => {
  const { data, error } = await supabase
    .from('user_habits_wizard_temp')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error fetching wizard progress:', error);
    throw error;
  }

  return data || null;
};

const saveWizardProgress = async ({ userId, current_step, habit_data }: SaveWizardProgressParams & { userId: string }) => {
  const existingProgress = await fetchWizardProgress(userId);

  const newHabitData = {
    ...(existingProgress?.habit_data || {}),
    ...habit_data,
  } as WizardHabitData; // Ensure type safety

  const upsertData = {
    user_id: userId,
    current_step: current_step,
    habit_data: newHabitData,
    last_saved_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_habits_wizard_temp')
    .upsert(upsertData); // Removed onConflict, relying on PRIMARY KEY

  if (error) {
    console.error('Error saving wizard progress:', error);
    throw error;
  }

  return { success: true };
};

export const useUserHabitWizardTemp = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: wizardProgress, isLoading, isError, refetch } = useQuery<UserHabitWizardTemp | null, Error>({
    queryKey: ['userHabitWizardTemp', userId],
    queryFn: () => fetchWizardProgress(userId!),
    enabled: !!userId,
    staleTime: 0, // Always refetch to get latest state
  });

  const saveProgressMutation = useMutation({
    mutationFn: (params: SaveWizardProgressParams) => {
      if (!userId) throw new Error('User not authenticated');
      return saveWizardProgress({ ...params, userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userHabitWizardTemp', userId] });
    },
    onError: (error) => {
      showError(`Failed to save wizard progress: ${error.message}`);
    },
  });

  const deleteProgressMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      const { error } = await supabase.from('user_habits_wizard_temp').delete().eq('user_id', userId);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userHabitWizardTemp', userId] });
    },
    onError: (error) => {
      showError(`Failed to clear wizard progress: ${error.message}`);
    },
  });

  return {
    wizardProgress,
    isLoading,
    isError,
    saveProgress: saveProgressMutation.mutateAsync,
    isSaving: saveProgressMutation.isPending,
    deleteProgress: deleteProgressMutation.mutateAsync,
    isDeleting: deleteProgressMutation.isPending,
    refetch,
  };
};