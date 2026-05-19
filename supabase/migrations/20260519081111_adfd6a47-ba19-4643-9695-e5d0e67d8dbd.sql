
-- Teacher reports ("whistle-blow") system
CREATE TABLE public.teacher_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  course_id uuid,
  category text NOT NULL,
  details text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_teacher_reports_status ON public.teacher_reports(status, created_at DESC);
CREATE INDEX idx_teacher_reports_teacher ON public.teacher_reports(teacher_id);

ALTER TABLE public.teacher_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters insert own reports"
  ON public.teacher_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND public.has_role(auth.uid(), 'learner'));

CREATE POLICY "Reporters view own reports"
  ON public.teacher_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update reports"
  ON public.teacher_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RPC: submit a report (validates input)
CREATE OR REPLACE FUNCTION public.submit_teacher_report(
  p_teacher_id uuid,
  p_category text,
  p_details text,
  p_course_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'learner') THEN
    RAISE EXCEPTION 'Only learners can report teachers';
  END IF;
  IF p_teacher_id IS NULL OR NOT public.has_role(p_teacher_id, 'teacher') THEN
    RAISE EXCEPTION 'Invalid teacher';
  END IF;
  IF p_category IS NULL OR length(trim(p_category)) = 0 OR length(p_category) > 80 THEN
    RAISE EXCEPTION 'category required (max 80 chars)';
  END IF;
  IF p_details IS NULL OR length(trim(p_details)) < 10 OR length(p_details) > 2000 THEN
    RAISE EXCEPTION 'details must be 10-2000 characters';
  END IF;

  INSERT INTO public.teacher_reports (reporter_id, teacher_id, course_id, category, details)
  VALUES (auth.uid(), p_teacher_id, p_course_id, trim(p_category), trim(p_details))
  RETURNING id INTO v_id;

  -- Notify all admins
  INSERT INTO public.notifications (user_id, title, message)
  SELECT ur.user_id,
         'New teacher report',
         'A learner submitted a report (' || trim(p_category) || '). Review it in the admin console.'
  FROM public.user_roles ur WHERE ur.role = 'admin';

  RETURN v_id;
END;
$$;

-- RPC: admin list with reporter + teacher info
CREATE OR REPLACE FUNCTION public.admin_list_teacher_reports(p_status text DEFAULT NULL)
RETURNS TABLE(
  id uuid, created_at timestamptz, status text, category text, details text,
  admin_notes text, resolved_at timestamptz,
  reporter_id uuid, reporter_name text, reporter_email text,
  teacher_id uuid, teacher_name text, teacher_email text,
  course_id uuid, course_title text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT r.id, r.created_at, r.status, r.category, r.details,
         r.admin_notes, r.resolved_at,
         r.reporter_id, rp.full_name, rp.email,
         r.teacher_id, tp.full_name, tp.email,
         r.course_id, c.title
  FROM public.teacher_reports r
  LEFT JOIN public.profiles rp ON rp.id = r.reporter_id
  LEFT JOIN public.profiles tp ON tp.id = r.teacher_id
  LEFT JOIN public.courses c ON c.id = r.course_id
  WHERE p_status IS NULL OR r.status = p_status
  ORDER BY
    CASE WHEN r.status = 'open' THEN 0 WHEN r.status = 'investigating' THEN 1 ELSE 2 END,
    r.created_at DESC;
END;
$$;

-- RPC: admin resolve / update status
CREATE OR REPLACE FUNCTION public.admin_update_teacher_report(
  p_report_id uuid, p_status text, p_admin_notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_status NOT IN ('open','investigating','resolved','dismissed') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.teacher_reports
  SET status = p_status,
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      resolved_by = CASE WHEN p_status IN ('resolved','dismissed') THEN auth.uid() ELSE resolved_by END,
      resolved_at = CASE WHEN p_status IN ('resolved','dismissed') THEN now() ELSE resolved_at END
  WHERE id = p_report_id;
END;
$$;

-- RPC: list teachers a learner can report (their course teachers, plus all teachers as fallback)
CREATE OR REPLACE FUNCTION public.list_reportable_teachers()
RETURNS TABLE(teacher_id uuid, full_name text, email text, course_id uuid, course_title text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT c.teacher_id, p.full_name, p.email, c.id, c.title
  FROM public.enrollments e
  JOIN public.courses c ON c.id = e.course_id
  JOIN public.profiles p ON p.id = c.teacher_id
  WHERE e.learner_id = auth.uid()
  ORDER BY p.full_name NULLS LAST;
$$;
