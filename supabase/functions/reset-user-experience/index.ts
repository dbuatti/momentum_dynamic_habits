// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function resetUserExperience(supabaseAdmin: SupabaseClient, userId: string) {
  // Reset profile stats related to experience and streaks
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      daily_streak: 0,
      xp: 0,
      level: 1,
      tasks_completed_today: 0,
      last_streak_update: null,
      last_daily_reward_claim: null,
      last_daily_reward_notification: null,
      last_low_energy_notification: null,
      // Keep other profile settings like timezone, name, neurodivergent_mode, etc.
    })
    .eq('id', userId);
  if (profileError) throw profileError;

  // Delete user badges (as they are tied to XP/streaks)
  const { error: badgesError } = await supabaseAdmin.from('user_badges').delete().eq('user_id', userId);
  if (badgesError) throw badgesError;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await resetUserExperience(supabaseAdmin, user.id);

    return new Response(JSON.stringify({ message: 'User experience reset successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})