
CREATE OR REPLACE FUNCTION public.admin_activity_log_range(
  p_from timestamptz,
  p_to timestamptz,
  p_limit int DEFAULT 10000
)
RETURNS TABLE (
  occurred_at timestamptz,
  user_id uuid,
  full_name text,
  email text,
  role text,
  action text,
  detail text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
    RAISE EXCEPTION 'Invalid date range';
  END IF;

  RETURN QUERY
  WITH events AS (
    SELECT lv.viewed_at AS occurred_at, lv.learner_id AS user_id, 'Viewed lesson'::text AS action, l.title AS detail
      FROM public.lesson_views lv JOIN public.lessons l ON l.id = lv.lesson_id
    UNION ALL
    SELECT lc.completed_at, lc.learner_id, 'Completed lesson', l.title
      FROM public.lesson_completions lc JOIN public.lessons l ON l.id = lc.lesson_id
    UNION ALL
    SELECT qa.started_at, qa.learner_id, 'Started quiz', q.title
      FROM public.quiz_attempts qa JOIN public.quizzes q ON q.id = qa.quiz_id
    UNION ALL
    SELECT qa.submitted_at, qa.learner_id, 'Submitted quiz', q.title || ' (' || qa.score || '/' || qa.max_score || ')'
      FROM public.quiz_attempts qa JOIN public.quizzes q ON q.id = qa.quiz_id
      WHERE qa.submitted_at IS NOT NULL
    UNION ALL
    SELECT e.enrolled_at, e.learner_id, 'Enrolled in course', c.title
      FROM public.enrollments e JOIN public.courses c ON c.id = e.course_id
    UNION ALL
    SELECT vca.joined_at, vca.learner_id, 'Joined virtual class', vc.title
      FROM public.virtual_class_attendance vca JOIN public.virtual_classes vc ON vc.id = vca.class_id
    UNION ALL
    SELECT fp.created_at, fp.author_id, CASE WHEN fp.parent_id IS NULL THEN 'Posted in forum' ELSE 'Replied in forum' END, COALESCE(fp.title, left(fp.body, 80))
      FROM public.forum_posts fp
    UNION ALL
    SELECT dm.created_at, dm.sender_id, 'Sent message', left(dm.body, 80)
      FROM public.direct_messages dm
    UNION ALL
    SELECT c.created_at, c.teacher_id, 'Created course', c.title
      FROM public.courses c
    UNION ALL
    SELECT cert.issued_at, cert.learner_id, 'Earned certificate', cert.course_name || ' (' || cert.certificate_code || ')'
      FROM public.certificates cert
  )
  SELECT ev.occurred_at, ev.user_id, p.full_name, p.email,
         CASE WHEN public.has_role(ev.user_id,'admin') THEN 'admin'
              WHEN public.has_role(ev.user_id,'teacher') THEN 'teacher'
              ELSE 'learner' END,
         ev.action, ev.detail
  FROM events ev
  LEFT JOIN public.profiles p ON p.id = ev.user_id
  WHERE ev.occurred_at IS NOT NULL
    AND ev.occurred_at >= p_from
    AND ev.occurred_at < p_to
  ORDER BY ev.occurred_at DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;
