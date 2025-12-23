"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';

// Define the structure for the wizard's habit data
export interface WizardHabitData {
  name: string;
  habit_key: string;
  category: string;
  unit: 'min' | 'reps' | 'dose';
  icon_name: string;
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
  short_description: string;
  // Step 3 fields
  session_duration: number; // Minutes per session
  weekly_frequency: number; // Days per week (redundant with frequency_per_week but clearer for user)
  barriers: string[]; // e.g., ['time', 'energy', 'focus']
  confidence_level: number; // 1-10
  motivation_type: 'stress_reduction' | 'skill_development' | 'health_improvement' | 'routine_building' | null;
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