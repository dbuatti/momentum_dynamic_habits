import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function resetUserProgress(supabaseAdmin: SupabaseClient, userId: string) {
  // Delete all user-specific data
  const deletePromises = [
    supabaseAdmin.from('completedtasks').delete().eq('user_id', userId),
    supabaseAdmin.from('user_badges').delete().eq('user_id', userId),
    supabaseAdmin.from('user_habits').delete().eq('user_id', userId),
  ];
  const results = await Promise.all(deletePromises);
  results.forEach(res => { if (res.error) throw res.error; });

  // Reset profile stats
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      daily_streak: 0,
      journey_start_date: new Date().toISOString().slice(0, 10),
      xp: 0,
      level: 1,
      energy: 100,
      tasks_completed_today: 0,
    })
    .eq('id', userId);
  if (profileError) throw profileError;

  // Re-initialize default habits
  const { error: habitError } = await supabaseAdmin.from('user_habits').insert([
      { user_id: userId, habit_key: 'pushups', long_term_goal: 200, target_completion_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10) },
      { user_id: userId, habit_key: 'meditation', long_term_goal: 120, target_completion_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10) },
      { user_id: userId, habit_key: 'kinesiology', long_term_goal: 60, target_completion_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 10) },
      { user_id: userId, habit_key: 'piano', long_term_goal: 60, target_completion_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 10) },
  ]);
  if (habitError) throw habitError;
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