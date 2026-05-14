
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_level text;

CREATE OR REPLACE FUNCTION public.enroll_class_in_course(p_course_id uuid, p_class_level text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
  v_is_owner boolean;
BEGIN
  IF p_class_level IS NULL OR length(trim(p_class_level)) = 0 THEN
    RAISE EXCEPTION 'class_level is required';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = p_course_id
      AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Not authorized to assign this course';
  END IF;

  WITH learners AS (
    SELECT p.id AS learner_id
    FROM public.profiles p
    WHERE p.class_level = p_class_level
      AND public.has_role(p.id, 'learner')
  ),
  ins AS (
    INSERT INTO public.enrollments (course_id, learner_id)
    SELECT p_course_id, l.learner_id
    FROM learners l
    WHERE NOT EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = p_course_id AND e.learner_id = l.learner_id
    )
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM ins;

  RETURN v_inserted;
END;
$$;
