import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { HabitCategory, MeasurementType } from '@/types/habit'; // Added MeasurementType

export interface CreateTemplateParams {
  id: string;
  name: string;
  category: HabitCategory;
  default_frequency: number;
  default_duration: number;
  default_mode: 'Trial' | 'Growth' | 'Fixed';
  default_chunks: number;
  auto_chunking: boolean;
  anchor_practice: boolean;
  unit: 'min' | 'reps' | 'dose';
  measurement_type: MeasurementType; // Added measurement_type
  xp_per_unit: number;
  energy_cost_per_unit: number;
  icon_name: string;
  plateau_days_required: number;
  short_description: string;
  is_public: boolean;
}

const createTemplate = async (template: CreateTemplateParams) => {
  const { error } = await supabase.from('habit_templates').insert(template);
  if (error) throw error;
  return { success: true };
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      showSuccess('Template contributed successfully!');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => {
      showError(`Failed to contribute template: ${error.message}`);
    },
  });
};