// @ts-nocheck
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function resetUserProgress(supabaseAdmin: SupabaseClient, userId: string) {
  // Delete all user-specific data
  const deletePromises = [
    supabaseAdmin.from('completedtasks').delete().eq('user_id', userId),
    supabaseAdmin.from('user_badges').delete().eq('user_id', userId),
    supabaseAdmin.from('user_habits').delete().eq('user_id', userId), // Deletes all user habits
    supabaseAdmin.from('habit_capsules').delete().eq('user_id', userId), // Delete habit capsules
    supabaseAdmin.from('reflections').delete().eq('user_id', userId), // Delete reflections
    supabaseAdmin.from('user_habits_wizard_temp').delete().eq('user_id', userId), // Delete wizard temp data
  ];
  const results = await Promise.all(deletePromises);
  results.forEach(res => { if (res.error) throw res.error; });

  // Reset profile stats to initial state
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      daily_streak: 0,
      journey_start_date: new Date().toISOString().slice(0, 10),
      xp: 0,
      level: 1,
      energy: 100,
      tasks_completed_today: 0,
      // Reset initial onboarding preferences as well for a truly blank slate
      num_initial_habits: 0,
      initial_habit_categories: [],
      initial_low_pressure_start: false,
      initial_session_duration_preference: 'medium',
      initial_allow_chunks: true,
      initial_weekly_frequency: 4,
      neurodivergent_mode: false, // Reset neurodivergent mode
      timezone: 'UTC', // Reset timezone to default
      default_auto_schedule_start_time: '09:00',
      default_auto_schedule_end_time: '17:00',
      first_name: null, // Clear first name
      last_name: null, // Clear last name
      last_active_at: null, // Reset last active
      last_streak_update: null,
      last_daily_reward_claim: null,
      last_daily_reward_notification: null,
      last_low_energy_notification: null,
      enable_daily_challenge_notifications: true,
      enable_low_energy_notifications: true,
      daily_challenge_target: 3,
      enable_delete_hotkeys: true,
      enable_aethersink_backup: true,
      is_in_regen_pod: false,
      regen_pod_start_time: null,
    })
    .eq('id', userId);
  if (profileError) throw profileError;
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

    await resetUserProgress(supabaseAdmin, user.id);

    return new Response(JSON.stringify({ message: 'User progress reset successfully' }), {
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