
CREATE TABLE IF NOT EXISTS public.scheduled_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  class_level text NOT NULL,
  title text NOT NULL,
  message text,
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  recipient_count integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sched_ann_due ON public.scheduled_announcements (send_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_sched_ann_sender ON public.scheduled_announcements (sender_id);

ALTER TABLE public.scheduled_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff create own scheduled announcements"
ON public.scheduled_announcements FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Senders and admins view scheduled announcements"
ON public.scheduled_announcements FOR SELECT TO authenticated
USING (sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Senders cancel own pending scheduled announcements"
ON public.scheduled_announcements FOR DELETE TO authenticated
USING (
  (sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  AND status = 'pending'
);

-- RPC to schedule an announcement
CREATE OR REPLACE FUNCTION public.schedule_class_announcement(
  p_class_level text,
  p_title text,
  p_message text,
  p_send_at timestamptz
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Not authorized to schedule announcements';
  END IF;
  IF p_class_level IS NULL OR length(trim(p_class_level)) = 0 THEN
    RAISE EXCEPTION 'class_level is required';
  END IF;
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'title is required';
  END IF;
  IF length(p_title) > 150 THEN RAISE EXCEPTION 'title too long (max 150)'; END IF;
  IF p_message IS NOT NULL AND length(p_message) > 2000 THEN RAISE EXCEPTION 'message too long (max 2000)'; END IF;
  IF p_send_at IS NULL OR p_send_at <= now() THEN
    RAISE EXCEPTION 'send_at must be in the future';
  END IF;

  INSERT INTO public.scheduled_announcements (sender_id, class_level, title, message, send_at)
  VALUES (auth.uid(), trim(p_class_level), trim(p_title), NULLIF(trim(coalesce(p_message,'')),''), p_send_at)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Dispatcher: broadcasts due pending announcements
CREATE OR REPLACE FUNCTION public.dispatch_due_announcements()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_count integer;
  v_total integer := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.scheduled_announcements
    WHERE status = 'pending' AND send_at <= now()
    ORDER BY send_at ASC
    LIMIT 100
  LOOP
    BEGIN
      WITH learners AS (
        SELECT p.id AS user_id FROM public.profiles p
        WHERE p.class_level = r.class_level AND public.has_role(p.id, 'learner')
      ),
      ins AS (
        INSERT INTO public.notifications (user_id, title, message)
        SELECT l.user_id, r.title, r.message FROM learners l
        RETURNING 1
      )
      SELECT count(*) INTO v_count FROM ins;

      UPDATE public.scheduled_announcements
      SET status = 'sent', sent_at = now(), recipient_count = v_count
      WHERE id = r.id;
      v_total := v_total + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.scheduled_announcements
      SET status = 'failed', error = SQLERRM
      WHERE id = r.id;
    END;
  END LOOP;
  RETURN v_total;
END;
$$;
