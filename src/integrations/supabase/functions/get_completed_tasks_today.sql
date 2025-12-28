CREATE OR REPLACE FUNCTION public.get_completed_tasks_today(p_user_id uuid, p_timezone text)
 RETURNS SETOF completedtasks
 LANGUAGE plpgsql -- Changed to plpgsql to allow DECLARE block
 SECURITY DEFINER
AS $function$
DECLARE
  v_day_rollover_hour INTEGER;
  v_start_of_day_for_query TIMESTAMP WITH TIME ZONE;
  v_current_time_in_tz TIME;
BEGIN
  -- Fetch the user's day_rollover_hour from the profiles table
  SELECT day_rollover_hour INTO v_day_rollover_hour
  FROM public.profiles
  WHERE id = p_user_id;

  -- Default to 0 if not set
  IF v_day_rollover_hour IS NULL THEN
    v_day_rollover_hour := 0;
  END IF;

  -- Calculate the start of the "current day" based on rollover hour
  v_current_time_in_tz := (NOW() AT TIME ZONE p_timezone)::time;

  IF v_current_time_in_tz < (v_day_rollover_hour || ':00')::time THEN
    -- If current time is before rollover, "today" started yesterday at rollover hour
    v_start_of_day_for_query := (DATE_TRUNC('day', NOW() AT TIME ZONE p_timezone) - '1 day'::interval + (v_day_rollover_hour || ' hours')::interval);
  ELSE
    -- If current time is after or at rollover, "today" started today at rollover hour
    v_start_of_day_for_query := (DATE_TRUNC('day', NOW() AT TIME ZONE p_timezone) + (v_day_rollover_hour || ' hours')::interval);
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.completedtasks
  WHERE
    user_id = p_user_id AND
    completed_at >= v_start_of_day_for_query AT TIME ZONE p_timezone AND
    completed_at < (v_start_of_day_for_query + '1 day'::interval) AT TIME ZONE p_timezone
  ORDER BY completed_at DESC;
END;
$function$;