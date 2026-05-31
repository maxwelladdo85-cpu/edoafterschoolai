
-- Filter options for analytics dropdowns
CREATE OR REPLACE FUNCTION public.admin_analytics_filter_options()
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE r json;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT json_build_object(
    'lgas', (SELECT COALESCE(json_agg(DISTINCT trim(lga) ORDER BY trim(lga)), '[]'::json)
             FROM profiles WHERE lga IS NOT NULL AND length(trim(lga)) > 0),
    'school_types', (SELECT COALESCE(json_agg(DISTINCT trim(school_type) ORDER BY trim(school_type)), '[]'::json)
             FROM profiles WHERE school_type IS NOT NULL AND length(trim(school_type)) > 0)
  ) INTO r;
  RETURN r;
END;
$$;

-- All analytics in one call, filterable
CREATE OR REPLACE FUNCTION public.admin_analytics_filtered(
  p_lga text DEFAULT NULL,
  p_school_type text DEFAULT NULL,
  p_days int DEFAULT 14
)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result json;
  v_lga text := NULLIF(trim(coalesce(p_lga,'')),'');
  v_st  text := NULLIF(trim(coalesce(p_school_type,'')),'');
  v_days int := GREATEST(LEAST(coalesce(p_days,14), 90), 1);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;

  WITH scoped_learners AS (
    SELECT p.id FROM profiles p
    WHERE public.has_role(p.id, 'learner')
      AND (v_lga IS NULL OR p.lga = v_lga)
      AND (v_st  IS NULL OR p.school_type = v_st)
  ),
  scoped_teachers AS (
    SELECT p.id FROM profiles p
    WHERE public.has_role(p.id, 'teacher')
      AND (v_lga IS NULL OR p.lga = v_lga)
      AND (v_st  IS NULL OR p.school_type = v_st)
  ),
  scoped_courses AS (
    SELECT c.id, c.title FROM courses c
    WHERE c.is_active
      AND (v_lga IS NULL AND v_st IS NULL
           OR c.teacher_id IN (SELECT id FROM scoped_teachers))
  ),
  days AS (
    SELECT d::date AS day FROM generate_series(CURRENT_DATE - (v_days - 1) * INTERVAL '1 day', CURRENT_DATE, INTERVAL '1 day') d
  ),
  activity AS (
    SELECT viewed_at::date AS day, learner_id AS uid FROM lesson_views
      WHERE learner_id IN (SELECT id FROM scoped_learners)
        AND viewed_at >= CURRENT_DATE - (v_days - 1) * INTERVAL '1 day'
    UNION
    SELECT started_at::date, learner_id FROM quiz_attempts
      WHERE learner_id IN (SELECT id FROM scoped_learners)
        AND started_at >= CURRENT_DATE - (v_days - 1) * INTERVAL '1 day'
    UNION
    SELECT joined_at::date, learner_id FROM virtual_class_attendance
      WHERE learner_id IN (SELECT id FROM scoped_learners)
        AND joined_at >= CURRENT_DATE - (v_days - 1) * INTERVAL '1 day'
  ),
  dau AS (
    SELECT d.day, COALESCE(count(DISTINCT a.uid), 0)::int AS active_users
    FROM days d LEFT JOIN activity a ON a.day = d.day
    GROUP BY d.day ORDER BY d.day
  ),
  enroll AS (
    SELECT d.day, COALESCE(count(e.id), 0)::int AS enrollments
    FROM days d
    LEFT JOIN enrollments e
      ON e.enrolled_at::date = d.day
     AND e.learner_id IN (SELECT id FROM scoped_learners)
    GROUP BY d.day ORDER BY d.day
  ),
  signups AS (
    SELECT d.day, COALESCE(count(p.id), 0)::int AS signups
    FROM days d
    LEFT JOIN profiles p
      ON p.created_at::date = d.day
     AND (v_lga IS NULL OR p.lga = v_lga)
     AND (v_st  IS NULL OR p.school_type = v_st)
    GROUP BY d.day ORDER BY d.day
  ),
  top_courses AS (
    SELECT c.id, c.title, count(e.id)::int AS enrollments
    FROM scoped_courses c
    LEFT JOIN enrollments e
      ON e.course_id = c.id
     AND e.learner_id IN (SELECT id FROM scoped_learners)
    GROUP BY c.id, c.title
    ORDER BY enrollments DESC NULLS LAST
    LIMIT 10
  ),
  course_lessons AS (
    SELECT c.id AS course_id, c.title, count(l.id) AS lesson_count
    FROM scoped_courses c
    LEFT JOIN modules m ON m.course_id = c.id
    LEFT JOIN lessons l ON l.module_id = m.id
    GROUP BY c.id, c.title
  ),
  per_learner AS (
    SELECT e.course_id, e.learner_id,
      CASE WHEN cl.lesson_count > 0 THEN
        (SELECT count(*) FROM lesson_completions lc
          JOIN lessons ll ON ll.id = lc.lesson_id
          JOIN modules mm ON mm.id = ll.module_id
         WHERE mm.course_id = e.course_id AND lc.learner_id = e.learner_id)::numeric
        / cl.lesson_count
      ELSE 0 END AS frac
    FROM enrollments e
    JOIN course_lessons cl ON cl.course_id = e.course_id
    WHERE e.learner_id IN (SELECT id FROM scoped_learners)
  ),
  completion AS (
    SELECT cl.course_id, cl.title,
      ROUND(COALESCE(avg(pl.frac) * 100, 0), 1)::numeric AS completion_pct
    FROM course_lessons cl
    LEFT JOIN per_learner pl ON pl.course_id = cl.course_id
    GROUP BY cl.course_id, cl.title
    ORDER BY completion_pct DESC
    LIMIT 10
  ),
  by_lga AS (
    SELECT COALESCE(NULLIF(trim(p.lga),''), 'Unknown') AS lga, count(*)::int AS learners
    FROM profiles p
    WHERE p.id IN (SELECT id FROM scoped_learners)
    GROUP BY 1
    ORDER BY learners DESC
    LIMIT 12
  ),
  by_school_type AS (
    SELECT COALESCE(NULLIF(trim(p.school_type),''), 'Unknown') AS school_type, count(*)::int AS learners
    FROM profiles p
    WHERE p.id IN (SELECT id FROM scoped_learners)
    GROUP BY 1
    ORDER BY learners DESC
  ),
  totals AS (
    SELECT
      (SELECT count(*) FROM scoped_learners)::int AS total_learners,
      (SELECT count(*) FROM scoped_teachers)::int AS total_teachers,
      (SELECT count(*) FROM scoped_courses)::int AS total_courses,
      (SELECT count(*) FROM enrollments e WHERE e.learner_id IN (SELECT id FROM scoped_learners))::int AS total_enrollments,
      (SELECT count(*) FROM certificates cert WHERE cert.learner_id IN (SELECT id FROM scoped_learners))::int AS certificates_issued
  )
  SELECT json_build_object(
    'totals', (SELECT row_to_json(t) FROM totals t),
    'dau', (SELECT COALESCE(json_agg(row_to_json(d)), '[]'::json) FROM dau d),
    'enrollments', (SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json) FROM enroll e),
    'signups', (SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) FROM signups s),
    'top_courses', (SELECT COALESCE(json_agg(row_to_json(tc)), '[]'::json) FROM top_courses tc),
    'completion', (SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json) FROM completion c),
    'by_lga', (SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json) FROM by_lga b),
    'by_school_type', (SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json) FROM by_school_type b)
  ) INTO result;
  RETURN result;
END;
$$;
