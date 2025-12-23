"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { HabitTemplate } from '@/lib/habit-templates';
import { UserHabitRecord } from '@/types/habit'; // Import UserHabitRecord for type consistency

interface CreateTemplateParams {
  id: string; // Template ID (habit_key)
  name: string;
  category: string;
  default_frequency: number;
  default_duration: number;
  default_mode: 'Trial' | 'Growth' | 'Fixed';
  default_chunks: number;
  auto_chunking: boolean;
  anchor_practice: boolean;
  unit: 'min' | 'reps' | 'dose';
  xp_per_unit: number;
  energy_cost_per_unit: number;
  icon_name: string;
  plateau_days_required: number;
  short_description: string;
  is_public: boolean;
}

const createTemplate = async ({ userId, template }: { userId: string; template: CreateTemplateParams }) => {
  const templateToInsert = {
    ...template,
    creator_id: userId,
  };

  const { error } = await supabase.from('habit_templates').insert(templateToInsert);

  if (error) throw error;
  return { success: true };
};

export const useCreateTemplate = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: CreateTemplateParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return createTemplate({ userId: session.user.id, template });
    },
    onSuccess: () => {
      showSuccess('Template contributed successfully!');
      queryClient.invalidateQueries({ queryKey: ['habitTemplates'] }); // Invalidate all templates to show new one
    },
    onError: (error) => {
      showError(`Failed to contribute template: ${error.message}`);
    },
  });
};