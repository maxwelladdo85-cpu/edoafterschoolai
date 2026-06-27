
-- Admins can view all direct messages
DROP POLICY IF EXISTS "Admins view all DMs" ON public.direct_messages;
CREATE POLICY "Admins view all DMs" ON public.direct_messages
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- List teachers a user can message (learners: all teachers; teachers: enrolled learners; admin: everyone)
CREATE OR REPLACE FUNCTION public.list_messageable_users()
RETURNS TABLE(user_id uuid, full_name text, email text, role text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
      SELECT p.id, p.full_name, p.email,
        CASE WHEN public.has_role(p.id,'admin') THEN 'admin'
             WHEN public.has_role(p.id,'teacher') THEN 'teacher'
             ELSE 'learner' END
      FROM public.profiles p
      WHERE p.id <> auth.uid()
      ORDER BY p.full_name NULLS LAST;
  ELSIF public.has_role(auth.uid(), 'teacher') THEN
    RETURN QUERY
      SELECT DISTINCT p.id, p.full_name, p.email, 'learner'::text
      FROM public.courses c
      JOIN public.enrollments e ON e.course_id = c.id
      JOIN public.profiles p ON p.id = e.learner_id
      WHERE c.teacher_id = auth.uid()
      ORDER BY p.full_name NULLS LAST;
  ELSE
    -- Learner: any teacher
    RETURN QUERY
      SELECT DISTINCT p.id, p.full_name, p.email, 'teacher'::text
      FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
      WHERE ur.role = 'teacher'
      ORDER BY p.full_name NULLS LAST;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_messageable_users() TO authenticated;

-- Teacher awards a badge/sticker to a single learner
CREATE OR REPLACE FUNCTION public.teacher_award_badge(p_learner uuid, p_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_code IS NULL OR length(trim(p_code)) = 0 OR length(p_code) > 50 THEN
    RAISE EXCEPTION 'Invalid sticker code';
  END IF;
  IF NOT public.has_role(p_learner,'learner') THEN
    RAISE EXCEPTION 'Recipient is not a learner';
  END IF;
  INSERT INTO public.badges (learner_id, code) VALUES (p_learner, trim(p_code))
  ON CONFLICT (learner_id, code) DO NOTHING;
  INSERT INTO public.notifications (user_id, title, message)
  VALUES (p_learner, 'You earned a new sticker! 🏅', 'Your teacher awarded you the "' || trim(p_code) || '" sticker. Check your badges!');
END;
$$;
GRANT EXECUTE ON FUNCTION public.teacher_award_badge(uuid, text) TO authenticated;

-- Teacher awards a badge to every learner in a class
CREATE OR REPLACE FUNCTION public.teacher_award_badge_to_class(p_class_level text, p_code text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_class_level IS NULL OR length(trim(p_class_level)) = 0 THEN
    RAISE EXCEPTION 'class_level required';
  END IF;
  IF p_code IS NULL OR length(trim(p_code)) = 0 OR length(p_code) > 50 THEN
    RAISE EXCEPTION 'Invalid sticker code';
  END IF;

  WITH learners AS (
    SELECT p.id FROM public.profiles p
    WHERE p.class_level = trim(p_class_level) AND public.has_role(p.id,'learner')
  ),
  ins AS (
    INSERT INTO public.badges (learner_id, code)
    SELECT id, trim(p_code) FROM learners
    ON CONFLICT (learner_id, code) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM ins;

  INSERT INTO public.notifications (user_id, title, message)
  SELECT l.id, 'You earned a new sticker! 🏅',
         'Your teacher awarded the "' || trim(p_code) || '" sticker to your class.'
  FROM (SELECT p.id FROM public.profiles p
        WHERE p.class_level = trim(p_class_level) AND public.has_role(p.id,'learner')) l;

  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.teacher_award_badge_to_class(text, text) TO authenticated;

-- Function for teacher to summarise & broadcast a message to all learners enrolled in a course
CREATE OR REPLACE FUNCTION public.send_course_announcement(p_course_id uuid, p_title text, p_message text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer := 0; v_is_owner boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = p_course_id
      AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  ) INTO v_is_owner;
  IF NOT v_is_owner THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN RAISE EXCEPTION 'title required'; END IF;
  IF length(p_title) > 150 THEN RAISE EXCEPTION 'title too long'; END IF;
  IF p_message IS NOT NULL AND length(p_message) > 5000 THEN RAISE EXCEPTION 'message too long'; END IF;

  WITH ins AS (
    INSERT INTO public.notifications (user_id, title, message)
    SELECT e.learner_id, trim(p_title), NULLIF(trim(coalesce(p_message,'')), '')
    FROM public.enrollments e WHERE e.course_id = p_course_id
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM ins;
  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.send_course_announcement(uuid, text, text) TO authenticated;
