"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';

interface CreateReflectionParams {
  prompt: string;
  notes: string;
}

const createReflection = async ({ userId, prompt, notes }: CreateReflectionParams & { userId: string }) => {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Check if a reflection already exists for today
  const { data: existingReflection, error: fetchError } = await supabase
    .from('reflections')
    .select('id, xp_bonus_awarded')
    .eq('user_id', userId)
    .eq('reflection_date', today)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    throw fetchError;
  }

  let reflectionId = existingReflection?.id;
  let xpBonusAwarded = existingReflection?.xp_bonus_awarded || false;

  if (reflectionId) {
    // Update existing reflection
    const { error: updateError } = await supabase
      .from('reflections')
      .update({ notes, prompt })
      .eq('id', reflectionId);
    if (updateError) throw updateError;
  } else {
    // Insert new reflection
    const { data, error: insertError } = await supabase
      .from('reflections')
      .insert({ user_id: userId, reflection_date: today, prompt, notes })
      .select('id')
      .single();
    if (insertError) throw insertError;
    reflectionId = data.id;
  }

  // Award XP bonus if not already awarded for today
  if (!xpBonusAwarded) {
    const XP_BONUS = 50; // Define XP bonus for reflection
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const newXp = (profile.xp || 0) + XP_BONUS;
    // Recalculate level based on new XP (assuming calculateLevel is available)
    // For now, we'll just update XP, level recalculation can be done on dashboard load
    const { error: xpUpdateError } = await supabase
      .from('profiles')
      .update({ xp: newXp })
      .eq('id', userId);

    if (xpUpdateError) throw xpUpdateError;

    // Mark XP bonus as awarded for this reflection
    await supabase
      .from('reflections')
      .update({ xp_bonus_awarded: true })
      .eq('id', reflectionId);
      
    return { success: true, xpAwarded: XP_BONUS };
  }

  return { success: true, xpAwarded: 0 }; // No XP awarded if already done
};

export const useCreateReflection = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateReflectionParams) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      return createReflection({ ...params, userId: session.user.id });
    },
    onSuccess: (data) => {
      if (data.xpAwarded > 0) {
        showSuccess(`Reflection saved! +${data.xpAwarded} XP bonus!`);
      } else {
        showSuccess('Reflection updated!');
      }
      queryClient.invalidateQueries({ queryKey: ['analyticsData', session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', session?.user?.id] }); // Invalidate dashboard to update XP/level
    },
    onError: (error) => {
      showError(`Failed to save reflection: ${error.message}`);
    },
  });
};