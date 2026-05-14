
-- Add optional notes column to lessons
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS notes text;

-- Attendance: log each time a learner opens a lesson
CREATE TABLE IF NOT EXISTS public.lesson_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_views_learner ON public.lesson_views(learner_id);
CREATE INDEX IF NOT EXISTS idx_lesson_views_lesson ON public.lesson_views(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_views_viewed_at ON public.lesson_views(viewed_at DESC);

ALTER TABLE public.lesson_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners insert own views"
  ON public.lesson_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = learner_id);

CREATE POLICY "Learners view own views"
  ON public.lesson_views FOR SELECT TO authenticated
  USING (auth.uid() = learner_id);

CREATE POLICY "Teachers and admins view course views"
  ON public.lesson_views FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.modules m ON m.id = l.module_id
      JOIN public.courses c ON c.id = m.course_id
      WHERE l.id = lesson_views.lesson_id AND c.teacher_id = auth.uid()
    )
  );
