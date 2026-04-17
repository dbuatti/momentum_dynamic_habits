-- Update get_completed_tasks_today to include the new habit_xp_earned column
CREATE OR REPLACE FUNCTION public.get_completed_tasks_today(p_user_id uuid, p_timezone text DEFAULT 'UTC'::text)
 RETURNS SETOF completedtasks
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_day_rollover_hour INTEGER;
  v_current_time_in_tz TIME;
  v_target_date DATE;
  v_boundaries RECORD;
  effective_timezone TEXT := COALESCE(p_timezone, 'UTC');
BEGIN
  SELECT day_rollover_hour INTO v_day_rollover_hour
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_day_rollover_hour IS NULL THEN
    v_day_rollover_hour := 0;
  END IF;

  v_current_time_in_tz := (NOW() AT TIME ZONE effective_timezone)::time;
  
  IF v_current_time_in_tz < (v_day_rollover_hour || ':00')::time THEN
    v_target_date := (NOW() AT TIME ZONE effective_timezone)::date - 1;
  ELSE
    v_target_date := (NOW() AT TIME ZONE effective_timezone)::date;
  END IF;

  SELECT start_time, end_time INTO v_boundaries
  FROM public.get_day_boundaries(p_user_id, v_target_date);

  RETURN QUERY
  SELECT 
    id, user_id, task_name, original_id, duration_scheduled, duration_used, 
    completed_at, xp_earned, energy_cost, is_critical, original_source, 
    original_scheduled_date, created_at, difficulty_rating, note, capsule_index,
    is_work, priority, is_break, habit_xp_earned -- Added habit_xp_earned and other missing columns
  FROM public.completedtasks
  WHERE
    user_id = p_user_id AND
    completed_at >= v_boundaries.start_time AND
    completed_at < v_boundaries.end_time
  ORDER BY completed_at DESC;
END;
$function$;

-- Update upsert_user_habit to include habit_xp and habit_level
CREATE OR REPLACE FUNCTION public.upsert_user_habit(
    p_user_id uuid, 
    p_habit_key text, 
    p_name text, 
    p_category text, 
    p_current_daily_goal integer, 
    p_frequency_per_week integer, 
    p_is_trial_mode boolean, 
    p_is_fixed boolean, 
    p_anchor_practice boolean, 
    p_auto_chunking boolean, 
    p_unit text, 
    p_xp_per_unit integer, 
    p_energy_cost_per_unit double precision, 
    p_icon_name text, 
    p_dependent_on_habit_id uuid, 
    p_plateau_days_required integer, 
    p_window_start text, 
    p_window_end text, 
    p_carryover_enabled boolean, 
    p_long_term_goal integer, 
    p_target_completion_date date, 
    p_momentum_level text, 
    p_lifetime_progress integer, 
    p_last_goal_increase_date date, 
    p_is_frozen boolean, 
    p_max_goal_cap integer, 
    p_last_plateau_start_date date, 
    p_completions_in_plateau integer, 
    p_growth_phase text, 
    p_days_of_week integer[], 
    p_enable_chunks boolean, 
    p_num_chunks integer, 
    p_chunk_duration double precision, 
    p_is_visible boolean, 
    p_measurement_type text DEFAULT 'timer'::text, 
    p_growth_type text DEFAULT 'fixed'::text, 
    p_growth_value numeric DEFAULT 1, 
    p_weekly_session_min_duration integer DEFAULT 10, 
    p_complete_on_finish boolean DEFAULT true, 
    p_is_weekly_goal boolean DEFAULT false,
    p_habit_xp numeric DEFAULT 0,
    p_habit_level integer DEFAULT 1
)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.user_habits (
    user_id, habit_key, name, category, current_daily_goal, frequency_per_week,
    is_trial_mode, is_fixed, anchor_practice, auto_chunking, unit, xp_per_unit,
    energy_cost_per_unit, icon_name, dependent_on_habit_id, plateau_days_required,
    window_start, window_end, carryover_enabled, long_term_goal, target_completion_date,
    momentum_level, lifetime_progress, last_goal_increase_date, is_frozen, max_goal_cap,
    last_plateau_start_date, completions_in_plateau, growth_phase, days_of_week,
    enable_chunks, num_chunks, chunk_duration, is_visible, measurement_type,
    growth_type, growth_value, weekly_session_min_duration, complete_on_finish, is_weekly_goal,
    habit_xp, habit_level
  )
  VALUES (
    p_user_id, p_habit_key, p_name, p_category, p_current_daily_goal, p_frequency_per_week,
    p_is_trial_mode, p_is_fixed, p_anchor_practice, p_auto_chunking, p_unit, p_xp_per_unit,
    p_energy_cost_per_unit, p_icon_name, p_dependent_on_habit_id, p_plateau_days_required,
    p_window_start, p_window_end, p_carryover_enabled, p_long_term_goal, p_target_completion_date,
    p_momentum_level, p_lifetime_progress, p_last_goal_increase_date, p_is_frozen, p_max_goal_cap,
    p_last_plateau_start_date, p_completions_in_plateau, p_growth_phase, p_days_of_week,
    p_enable_chunks, p_num_chunks, p_chunk_duration, p_is_visible, p_measurement_type,
    p_growth_type, p_growth_value, p_weekly_session_min_duration, p_complete_on_finish, p_is_weekly_goal,
    p_habit_xp, p_habit_level
  )
  ON CONFLICT (user_id, habit_key) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    current_daily_goal = EXCLUDED.current_daily_goal,
    frequency_per_week = EXCLUDED.frequency_per_week,
    is_trial_mode = EXCLUDED.is_trial_mode,
    is_fixed = EXCLUDED.is_fixed,
    anchor_practice = EXCLUDED.anchor_practice,
    auto_chunking = EXCLUDED.auto_chunking,
    unit = EXCLUDED.unit,
    xp_per_unit = EXCLUDED.xp_per_unit,
    energy_cost_per_unit = EXCLUDED.energy_cost_per_unit,
    icon_name = EXCLUDED.icon_name,
    dependent_on_habit_id = EXCLUDED.dependent_on_habit_id,
    plateau_days_required = EXCLUDED.plateau_days_required,
    window_start = EXCLUDED.window_start,
    window_end = EXCLUDED.window_end,
    carryover_enabled = EXCLUDED.carryover_enabled,
    long_term_goal = EXCLUDED.long_term_goal,
    target_completion_date = EXCLUDED.target_completion_date,
    momentum_level = EXCLUDED.momentum_level,
    lifetime_progress = EXCLUDED.lifetime_progress,
    last_goal_increase_date = EXCLUDED.last_goal_increase_date,
    is_frozen = EXCLUDED.is_frozen,
    max_goal_cap = EXCLUDED.max_goal_cap,
    last_plateau_start_date = EXCLUDED.last_plateau_start_date,
    completions_in_plateau = EXCLUDED.completions_in_plateau,
    growth_phase = EXCLUDED.growth_phase,
    days_of_week = EXCLUDED.days_of_week,
    enable_chunks = EXCLUDED.enable_chunks,
    num_chunks = EXCLUDED.num_chunks,
    chunk_duration = EXCLUDED.chunk_duration,
    is_visible = EXCLUDED.is_visible,
    measurement_type = EXCLUDED.measurement_type,
    growth_type = EXCLUDED.growth_type,
    growth_value = EXCLUDED.growth_value,
    weekly_session_min_duration = EXCLUDED.weekly_session_min_duration,
    complete_on_finish = EXCLUDED.complete_on_finish,
    is_weekly_goal = EXCLUDED.is_weekly_goal,
    habit_xp = COALESCE(EXCLUDED.habit_xp, user_habits.habit_xp),
    habit_level = COALESCE(EXCLUDED.habit_level, user_habits.habit_level);
END;
$function$;