
ALTER TABLE public.scheduled_announcements
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'learners';

-- Make class_level optional for teacher announcements (e.g. all teachers)
ALTER TABLE public.scheduled_announcements
  ALTER COLUMN class_level DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.send_teacher_announcement(
  p_class_level text,
  p_title text,
  p_message text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted integer := 0;
  v_class text;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Not authorized to send announcements';
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

  v_class := NULLIF(trim(coalesce(p_class_level, '')), '');

  WITH teachers AS (
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = 'teacher'
      AND (
        v_class IS NULL
        OR EXISTS (
          SELECT 1 FROM public.courses c
          WHERE c.teacher_id = ur.user_id
            AND c.class_level = v_class
        )
      )
  ),
  ins AS (
    INSERT INTO public.notifications (user_id, title, message)
    SELECT t.user_id, trim(p_title), NULLIF(trim(coalesce(p_message,'')), '')
    FROM teachers t
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM ins;

  INSERT INTO public.scheduled_announcements
    (sender_id, class_level, title, message, send_at, status, sent_at, recipient_count, audience)
  VALUES
    (auth.uid(), v_class, trim(p_title),
     NULLIF(trim(coalesce(p_message,'')),''),
     now(), 'sent', now(), v_inserted, 'teachers');

  RETURN v_inserted;
END;
$$;
