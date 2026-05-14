
-- 1. Add status column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check CHECK (status IN ('active','inactive','pending'));

-- 2. Allow user to mark themselves pending at signup (via update; covered by existing self-update policy)

-- 3. Admin overview stats
CREATE OR REPLACE FUNCTION public.admin_overview_stats()
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result json;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT json_build_object(
    'total_learners', (SELECT count(*) FROM public.user_roles WHERE role = 'learner'),
    'total_teachers', (SELECT count(*) FROM public.user_roles WHERE role = 'teacher'),
    'total_courses', (SELECT count(*) FROM public.courses WHERE is_active = true),
    'active_sessions_today', (
      SELECT count(*) FROM public.virtual_classes
      WHERE scheduled_at::date = CURRENT_DATE
    ),
    'pending_teachers', (
      SELECT count(*) FROM public.profiles WHERE status = 'pending'
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- 4. Weekly enrollments (last 7 days)
CREATE OR REPLACE FUNCTION public.admin_weekly_enrollments()
RETURNS TABLE(day date, enrollments bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT d::date AS day,
         COALESCE(count(e.id), 0)::bigint AS enrollments
  FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') d
  LEFT JOIN public.enrollments e ON e.enrolled_at::date = d::date
  GROUP BY d
  ORDER BY d;
END;
$$;

-- 5. Top 5 popular courses
CREATE OR REPLACE FUNCTION public.admin_top_courses()
RETURNS TABLE(course_id uuid, title text, enrollments bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT c.id, c.title, count(e.id)::bigint AS enrollments
  FROM public.courses c
  LEFT JOIN public.enrollments e ON e.course_id = c.id
  GROUP BY c.id, c.title
  ORDER BY enrollments DESC
  LIMIT 5;
END;
$$;

-- 6. Completion rates per course
CREATE OR REPLACE FUNCTION public.admin_completion_rates()
RETURNS TABLE(course_id uuid, title text, completion_pct numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  WITH course_lessons AS (
    SELECT c.id AS course_id, c.title, count(l.id) AS lesson_count
    FROM public.courses c
    LEFT JOIN public.modules m ON m.course_id = c.id
    LEFT JOIN public.lessons l ON l.module_id = m.id
    GROUP BY c.id, c.title
  ),
  per_learner AS (
    SELECT e.course_id, e.learner_id,
           CASE WHEN cl.lesson_count > 0 THEN
             (SELECT count(*) FROM public.lesson_completions lc
              JOIN public.lessons ll ON ll.id = lc.lesson_id
              JOIN public.modules mm ON mm.id = ll.module_id
              WHERE mm.course_id = e.course_id AND lc.learner_id = e.learner_id)::numeric
             / cl.lesson_count
           ELSE 0 END AS frac
    FROM public.enrollments e
    JOIN course_lessons cl ON cl.course_id = e.course_id
  )
  SELECT cl.course_id, cl.title,
         ROUND(COALESCE(avg(pl.frac) * 100, 0), 1) AS completion_pct
  FROM course_lessons cl
  LEFT JOIN per_learner pl ON pl.course_id = cl.course_id
  GROUP BY cl.course_id, cl.title
  ORDER BY completion_pct DESC
  LIMIT 10;
END;
$$;

-- 7. Daily active users (last 14 days) — distinct learners with lesson_views OR quiz_attempts
CREATE OR REPLACE FUNCTION public.admin_daily_active_users()
RETURNS TABLE(day date, active_users bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  WITH days AS (
    SELECT d::date AS day FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') d
  ),
  activity AS (
    SELECT viewed_at::date AS day, learner_id AS user_id FROM public.lesson_views
    UNION
    SELECT started_at::date, learner_id FROM public.quiz_attempts
    UNION
    SELECT joined_at::date, learner_id FROM public.virtual_class_attendance
  )
  SELECT d.day, COALESCE(count(DISTINCT a.user_id), 0)::bigint
  FROM days d
  LEFT JOIN activity a ON a.day = d.day
  GROUP BY d.day
  ORDER BY d.day;
END;
$$;

-- 8. List pending teachers
CREATE OR REPLACE FUNCTION public.admin_list_pending_teachers()
RETURNS TABLE(id uuid, email text, full_name text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.created_at
  FROM public.profiles p
  WHERE p.status = 'pending'
  ORDER BY p.created_at DESC;
END;
$$;

-- 9. Approve teacher
CREATE OR REPLACE FUNCTION public.admin_approve_teacher(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles SET status = 'active' WHERE id = p_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, 'teacher')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 10. Reject teacher / set status
CREATE OR REPLACE FUNCTION public.admin_set_user_status(p_user_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_status NOT IN ('active','inactive','pending') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.profiles SET status = p_status WHERE id = p_user_id;
END;
$$;
