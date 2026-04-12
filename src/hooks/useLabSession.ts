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

    const { data, error } = await supabase
      .from('lab_sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (data) {
      setStage(data.stage as LabStage);
      setLabType(data.lab_type);
      setSeconds(data.seconds_elapsed);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSession();
  }, [session]);

  const updateSession = async (newLabType: string, newStage: LabStage, newSeconds: number) => {
    if (!session?.user?.id) return;

    setStage(newStage);
    setLabType(newLabType);
    setSeconds(newSeconds);

    await supabase
      .from('lab_sessions')
      .upsert({
        user_id: session.user.id,
        lab_type: newLabType,
        stage: newStage,
        seconds_elapsed: newSeconds,
        last_updated_at: new Date().toISOString()
      });
  };

  const resetSession = async () => {
    if (!session?.user?.id) return;

    setStage('start');
    setLabType(null);
    setSeconds(0);

    await supabase
      .from('lab_sessions')
      .delete()
      .eq('user_id', session.user.id);
  };

  return { stage, labType, seconds, loading, updateSession, resetSession };
}