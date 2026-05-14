
CREATE TABLE public.virtual_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  zoom_url TEXT NOT NULL,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_virtual_classes_course ON public.virtual_classes(course_id);
CREATE INDEX idx_virtual_classes_scheduled ON public.virtual_classes(scheduled_at);

ALTER TABLE public.virtual_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own virtual classes"
ON public.virtual_classes FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled learners view virtual classes"
ON public.virtual_classes FOR SELECT TO authenticated
USING (
  teacher_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = virtual_classes.course_id AND e.learner_id = auth.uid()
  )
);

CREATE TABLE public.virtual_class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.virtual_classes(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, learner_id)
);

CREATE INDEX idx_vca_class ON public.virtual_class_attendance(class_id);
CREATE INDEX idx_vca_learner ON public.virtual_class_attendance(learner_id);

ALTER TABLE public.virtual_class_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners insert own attendance"
ON public.virtual_class_attendance FOR INSERT TO authenticated
WITH CHECK (learner_id = auth.uid());

CREATE POLICY "Learners view own attendance"
ON public.virtual_class_attendance FOR SELECT TO authenticated
USING (learner_id = auth.uid());

CREATE POLICY "Teachers and admins view course attendance"
ON public.virtual_class_attendance FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.virtual_classes vc
    WHERE vc.id = virtual_class_attendance.class_id AND vc.teacher_id = auth.uid()
  )
);
