
CREATE OR REPLACE FUNCTION public.admin_performance_stats()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE result json;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT json_build_object(
    'active_today', (
      SELECT count(DISTINCT uid) FROM (
        SELECT learner_id AS uid FROM public.lesson_views WHERE viewed_at::date = CURRENT_DATE
        UNION ALL SELECT learner_id FROM public.quiz_attempts WHERE started_at::date = CURRENT_DATE
        UNION ALL SELECT learner_id FROM public.virtual_class_attendance WHERE joined_at::date = CURRENT_DATE
        UNION ALL SELECT learner_id FROM public.tutor_messages WHERE created_at::date = CURRENT_DATE
      ) t
    ),
    'online_now', (
      SELECT count(DISTINCT uid) FROM (
        SELECT learner_id AS uid FROM public.lesson_views WHERE viewed_at > now() - INTERVAL '5 minutes'
        UNION ALL SELECT learner_id FROM public.tutor_messages WHERE created_at > now() - INTERVAL '5 minutes'
        UNION ALL SELECT sender_id FROM public.direct_messages WHERE created_at > now() - INTERVAL '5 minutes'
      ) t
    ),
    'lesson_views_last_hour', (
      SELECT count(*) FROM public.lesson_views WHERE viewed_at > now() - INTERVAL '1 hour'
    ),
    'ai_messages_today', (
      SELECT count(*) FROM public.tutor_messages WHERE created_at::date = CURRENT_DATE AND role = 'user'
    ),
    'ai_messages_last_hour', (
      SELECT count(*) FROM public.tutor_messages WHERE created_at > now() - INTERVAL '1 hour' AND role = 'user'
    ),
    'quiz_attempts_today', (
      SELECT count(*) FROM public.quiz_attempts WHERE started_at::date = CURRENT_DATE
    ),
    'new_signups_today', (
      SELECT count(*) FROM public.profiles WHERE created_at::date = CURRENT_DATE
    ),
    'top_ai_users_today', (
      SELECT COALESCE(json_agg(row_to_json(x)), '[]'::json) FROM (
        SELECT p.full_name, p.email, count(*)::int AS message_count
        FROM public.tutor_messages tm
        LEFT JOIN public.profiles p ON p.id = tm.learner_id
        WHERE tm.created_at::date = CURRENT_DATE AND tm.role = 'user'
        GROUP BY p.full_name, p.email
        ORDER BY message_count DESC
        LIMIT 10
      ) x
    )
  ) INTO result;
  RETURN result;
END;
$$;
