CREATE TABLE public.tutor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tutor_messages_learner_course ON public.tutor_messages(learner_id, course_id, created_at);

ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners view own tutor messages"
  ON public.tutor_messages FOR SELECT
  USING (auth.uid() = learner_id);

CREATE POLICY "Learners insert own tutor messages"
  ON public.tutor_messages FOR INSERT
  WITH CHECK (auth.uid() = learner_id);

CREATE POLICY "Learners delete own tutor messages"
  ON public.tutor_messages FOR DELETE
  USING (auth.uid() = learner_id);

CREATE POLICY "Course teachers view tutor messages"
  ON public.tutor_messages FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );