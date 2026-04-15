import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export type LabStage = 'start' | 'active' | 'complete';

export function useLabSession() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: sessionData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['labSession', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('lab_sessions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data;
    },
    enabled: !!userId,
    retry: false,
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ 
      labType, 
      stage, 
      seconds, 
      metadata = {} 
    }: { 
      labType: string; 
      stage: LabStage; 
      seconds: number;
      metadata?: any;
    }) => {
      if (!userId) return;

      const { error } = await supabase
        .from('lab_sessions')
        .upsert({
          user_id: userId,
          lab_type: labType,
          stage: stage,
          seconds_elapsed: seconds,
          metadata: metadata,
          last_updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labSession', userId] });
    }
  });

  const resetSessionMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      const { error } = await supabase
        .from('lab_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labSession', userId] });
    }
  });

  return { 
    stage: (sessionData?.stage as LabStage) || 'start', 
    labType: sessionData?.lab_type || null, 
    seconds: sessionData?.seconds_elapsed || 0, 
    metadata: sessionData?.metadata || {},
    loading, 
    error: queryError,
    updateSession: (labType: string, stage: LabStage, seconds: number, metadata?: any) => 
      updateSessionMutation.mutateAsync({ labType, stage, seconds, metadata }), 
    resetSession: resetSessionMutation.mutateAsync 
  };
}