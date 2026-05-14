CREATE OR REPLACE FUNCTION public.send_class_announcement(
  p_class_level text,
  p_title text,
  p_message text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
  v_authorized boolean;
BEGIN
  IF p_class_level IS NULL OR length(trim(p_class_level)) = 0 THEN
    RAISE EXCEPTION 'class_level is required';
  END IF;
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'title is required';
  END IF;
  IF length(p_title) > 150 THEN
    RAISE EXCEPTION 'title too long (max 150 chars)';
  END IF;
  IF p_message IS NOT NULL AND length(p_message) > 2000 THEN
    RAISE EXCEPTION 'message too long (max 2000 chars)';
  END IF;

  v_authorized := public.has_role(auth.uid(), 'teacher')
                  OR public.has_role(auth.uid(), 'admin');
  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized to send announcements';
  END IF;

  WITH learners AS (
    SELECT p.id AS user_id
    FROM public.profiles p
    WHERE p.class_level = p_class_level
      AND public.has_role(p.id, 'learner')
  ),
  ins AS (
    INSERT INTO public.notifications (user_id, title, message)
    SELECT l.user_id, trim(p_title), NULLIF(trim(coalesce(p_message, '')), '')
    FROM learners l
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM ins;

  RETURN v_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_learner_classes()
RETURNS TABLE(class_level text, learner_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT trim(p.class_level) AS class_level, count(*)::bigint AS learner_count
  FROM public.profiles p
  WHERE p.class_level IS NOT NULL
    AND length(trim(p.class_level)) > 0
    AND public.has_role(p.id, 'learner')
    AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
  GROUP BY trim(p.class_level)
  ORDER BY trim(p.class_level);
$$;

REVOKE EXECUTE ON FUNCTION public.send_class_announcement(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_learner_classes() FROM anon;
GRANT EXECUTE ON FUNCTION public.send_class_announcement(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_learner_classes() TO authenticated;