CREATE TABLE IF NOT EXISTS public.lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (learner_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS lesson_completions_learner_idx ON public.lesson_completions(learner_id);
CREATE INDEX IF NOT EXISTS lesson_completions_lesson_idx ON public.lesson_completions(lesson_id);

ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners manage own completions"
ON public.lesson_completions
FOR ALL
TO authenticated
USING (auth.uid() = learner_id)
WITH CHECK (auth.uid() = learner_id);

CREATE POLICY "Teachers and admins view course completions"
ON public.lesson_completions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    WHERE l.id = lesson_completions.lesson_id
      AND c.teacher_id = auth.uid()
  )
);