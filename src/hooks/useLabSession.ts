import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export type LabStage = 'start' | 'active' | 'complete';

export function useLabSession() {
  const { session } = useSession();
  const [stage, setStage] = useState<LabStage>('start');
  const [labType, setLabType] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('lab_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        // Handle missing table (404/42P01/PGRST205) or no record found (PGRST116)
        if (
          error.code === 'PGRST116' || 
          error.code === '42P01' || 
          error.code === 'PGRST205' ||
          error.message?.includes('not found')
        ) {
          setLoading(false);
          return;
        }
        throw error;
      }

      if (data) {
        setStage(data.stage as LabStage);
        setLabType(data.lab_type);
        setSeconds(data.seconds_elapsed);
      }
    } catch (err) {
      // Silently fail for schema issues to prevent app crashes
      console.debug('[LabSession] Session persistence unavailable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [session]);

  const updateSession = async (newLabType: string, newStage: LabStage, newSeconds: number) => {
    if (!session?.user?.id) return;

    setStage(newStage);
    setLabType(newLabType);
    setSeconds(newSeconds);

    try {
      const { error } = await supabase
        .from('lab_sessions')
        .upsert({
          user_id: session.user.id,
          lab_type: newLabType,
          stage: newStage,
          seconds_elapsed: newSeconds,
          last_updated_at: new Date().toISOString()
        });
        
      if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
        console.debug('[LabSession] Table missing, progress not saved to cloud.');
      }
    } catch (err) {
      console.warn('[LabSession] Failed to save session:', err);
    }
  };

  const resetSession = async () => {
    if (!session?.user?.id) return;

    setStage('start');
    setLabType(null);
    setSeconds(0);

    try {
      await supabase
        .from('lab_sessions')
        .delete()
        .eq('user_id', session.user.id);
    } catch (err) {
      console.error('[LabSession] Failed to reset session:', err);
    }
  };

  return { stage, labType, seconds, loading, updateSession, resetSession };
}