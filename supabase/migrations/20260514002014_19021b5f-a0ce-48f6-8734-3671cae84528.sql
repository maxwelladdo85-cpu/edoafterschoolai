
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url text;

CREATE TYPE public.lesson_content_type AS ENUM ('video', 'pdf', 'audio', 'text');

CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  content_type public.lesson_content_type NOT NULL DEFAULT 'text',
  content_url text,
  content_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_modules_course ON public.modules(course_id, position);
CREATE INDEX idx_lessons_module ON public.lessons(module_id, position);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- modules policies
CREATE POLICY "View modules of viewable courses" ON public.modules FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = modules.course_id
  AND (c.is_active OR c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Teachers manage own course modules" ON public.modules FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = modules.course_id
  AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = modules.course_id
  AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- lessons policies
CREATE POLICY "View lessons of viewable courses" ON public.lessons FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id
  WHERE m.id = lessons.module_id
  AND (c.is_active OR c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));

CREATE POLICY "Teachers manage own course lessons" ON public.lessons FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id
  WHERE m.id = lessons.module_id
  AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id
  WHERE m.id = lessons.module_id
  AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));
