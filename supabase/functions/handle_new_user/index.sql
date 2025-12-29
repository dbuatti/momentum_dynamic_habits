CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    last_active_at,
    xp,
    level,
    daily_streak,
    energy,
    tasks_completed_today,
    default_auto_schedule_start_time,
    default_auto_schedule_end_time,
    enable_aethersink_backup,
    journey_start_date,
    num_initial_habits,
    initial_habit_categories,
    initial_low_pressure_start,
    initial_session_duration_preference,
    initial_allow_chunks,
    initial_weekly_frequency,
    day_rollover_hour -- Added new field
  )
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    NOW(),
    0, 1, 0, 100, 0, '09:00', '17:00', TRUE, NOW()::date,
    0,
    ARRAY[]::TEXT[],
    FALSE,
    'medium',
    TRUE,
    4,
    0 -- Default for day_rollover_hour
  );

  RETURN new;
END;
$function$;