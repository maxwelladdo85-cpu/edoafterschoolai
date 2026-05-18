
CREATE OR REPLACE FUNCTION public.send_class_announcement(p_class_level text, p_title text, p_message text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Persist history entry so it appears in the announcements log
  INSERT INTO public.scheduled_announcements
    (sender_id, class_level, title, message, send_at, status, sent_at, recipient_count)
  VALUES
    (auth.uid(), trim(p_class_level), trim(p_title),
     NULLIF(trim(coalesce(p_message,'')),''),
     now(), 'sent', now(), v_inserted);

  RETURN v_inserted;
END;
$function$;
