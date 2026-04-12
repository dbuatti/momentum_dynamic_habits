"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { HabitTemplate } from '@/lib/habit-templates';

interface FetchTemplatesParams {
  category?: string;
  searchQuery?: string;
}

const fetchTemplates = async (params: FetchTemplatesParams): Promise<HabitTemplate[]> => {
  let query = supabase.from('habit_templates').select('*');

  // Only fetch public templates or templates created by the current user
  // RLS policies already handle this, but adding a client-side filter for clarity/efficiency
  // For now, we'll rely on RLS to filter by creator_id if not public.
  // We explicitly ask for public ones here.
  query = query.eq('is_public', true);

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }

  if (params.searchQuery) {
    query = query.ilike('name', `%${params.searchQuery}%`);
  }

  query = query.order('name', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching templates:', error);
    throw new Error('Failed to fetch templates');
  }

  return data || [];
};

export const useTemplates = (params: FetchTemplatesParams = {}) => {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery<HabitTemplate[], Error>({
    queryKey: ['habitTemplates', params, userId], // Include userId in queryKey for potential user-specific templates
    queryFn: () => fetchTemplates(params),
    enabled: !!userId, // Only fetch if user is logged in
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};