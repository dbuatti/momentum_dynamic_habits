"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { MeasurementType } from '@/types/habit';

export interface WizardHabitData {
  name: string;
  habit_key: string;
  category: string;
  unit: 'min' | 'reps' | 'dose';
  measurement_type: MeasurementType;
  icon_name: string;
  short_description: string;
  
  motivation_type: 'stress_reduction' | 'skill_development' | 'health_improvement' | 'routine_building' | null;
  motivation_type_skipped?: boolean;

  energy_per_session: 'very_little' | 'a_bit' | 'moderate' | 'plenty' | null;
  energy_per_session_skipped?: boolean;
  consistency_reality: '1-2_days' | '3-4_days' | 'most_days' | 'daily' | null;
  consistency_reality_skipped?: boolean;
  emotional_cost: 'light' | 'some_resistance' | 'heavy' | null;
  emotional_cost_skipped?: boolean;
  confidence_check: number | null; 
  confidence_check_skipped?: boolean;

  barriers: string[];
  barriers_skipped?: boolean;
  missed_day_response: 'keep_going' | 'discouraged' | 'stop_completely' | null;
  missed_day_response_skipped?: boolean;
  sensitivity_setting: 'gentle' | 'neutral' | 'direct' | null;
  sensitivity_setting_skipped?: boolean;

  time_of_day_fit: 'morning' | 'midday' | 'afternoon' | 'evening' | 'anytime' | null;
  time_of_day_fit_skipped?: boolean;
  dependency_check: 'after_waking' | 'after_work' | 'after_another_habit' | 'none' | null;
  dependency_check_skipped?: boolean;
  time_pressure_check: 'always' | 'only_if_time' | 'decide_later' | null;
  time_pressure_check_skipped?: boolean;

  growth_appetite: 'auto' | 'suggest' | 'steady' | null;
  growth_appetite_skipped?: boolean;
  growth_style: 'duration' | 'frequency' | 'both' | null;
  growth_style_skipped?: boolean;
  failure_response: 'reduce' | 'pause' | 'ask' | null;
  failure_response_skipped?: boolean;
  success_definition: 'sometimes' | 'most_weeks' | 'automatic' | null;
  success_definition_skipped?: boolean;

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
  carryover_enabled: boolean;
  safety_net_choice_skipped?: boolean;
  
  timing_preference?: string;
  flexibility?: 'strict' | 'flexible' | 'none';
  sequence_bias?: 'early' | 'after_core' | 'energy_based';
  soft_lock?: boolean;
  safety_net_choice?: 'none' | 'rollover' | 'gentle';
  
  weekly_session_min_duration?: number;
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

  if (error && error.code !== 'PGRST116') {
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
  } as WizardHabitData;

  const upsertData = {
    user_id: userId,
    current_step: current_step,
    habit_data: newHabitData,
    last_saved_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_habits_wizard_temp')
    .upsert(upsertData);

  if (error) {
    console.error('Error saving wizard progress:', error);
    throw error;
  }

  return { success: true };
};

const clearWizardProgress = async (userId: string) => {
  const { error } = await supabase.from('user_habits_wizard_temp').delete().eq('user_id', userId);
  if (error) throw error;
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
    staleTime: 0,
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
      return clearWizardProgress(userId);
    },
    onSuccess: () => {
      // CRITICAL FIX: Use removeQueries to ensure the old draft doesn't flicker back during refetching
      queryClient.removeQueries({ queryKey: ['userHabitWizardTemp', userId] });
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
    clearProgress: deleteProgressMutation.mutateAsync, // Expose clearProgress explicitly
  };
};