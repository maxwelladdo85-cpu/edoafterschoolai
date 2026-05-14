
-- Enums
CREATE TYPE public.question_type AS ENUM ('mcq', 'true_false', 'short_answer');

-- Quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER NOT NULL DEFAULT 10 CHECK (time_limit_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type public.question_type NOT NULL,
  prompt TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  position INTEGER NOT NULL DEFAULT 0,
  correct_short_answer TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.question_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  UNIQUE (quiz_id, learner_id, attempt_number)
);

CREATE TABLE public.attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_choice_id UUID REFERENCES public.question_choices(id) ON DELETE SET NULL,
  text_answer TEXT,
  is_correct BOOLEAN,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  UNIQUE (attempt_id, question_id)
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;

-- Quizzes policies
CREATE POLICY "View quizzes of viewable courses" ON public.quizzes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = quizzes.course_id AND (c.is_active OR c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Teachers manage own course quizzes" ON public.quizzes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = quizzes.course_id AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = quizzes.course_id AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- Questions policies
CREATE POLICY "View questions of viewable quizzes" ON public.questions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id
  WHERE q.id = questions.quiz_id AND (c.is_active OR c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Teachers manage own quiz questions" ON public.questions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id
  WHERE q.id = questions.quiz_id AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id
  WHERE q.id = questions.quiz_id AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- Choices policies
CREATE POLICY "View choices of viewable questions" ON public.question_choices FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.questions qu JOIN public.quizzes q ON q.id = qu.quiz_id
  JOIN public.courses c ON c.id = q.course_id
  WHERE qu.id = question_choices.question_id AND (c.is_active OR c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Teachers manage own quiz choices" ON public.question_choices FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.questions qu JOIN public.quizzes q ON q.id = qu.quiz_id
  JOIN public.courses c ON c.id = q.course_id
  WHERE qu.id = question_choices.question_id AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.questions qu JOIN public.quizzes q ON q.id = qu.quiz_id
  JOIN public.courses c ON c.id = q.course_id
  WHERE qu.id = question_choices.question_id AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- Attempts policies
CREATE POLICY "Learners create own attempts" ON public.quiz_attempts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = learner_id AND attempt_number BETWEEN 1 AND 3
  AND (SELECT COUNT(*) FROM public.quiz_attempts a WHERE a.quiz_id = quiz_attempts.quiz_id AND a.learner_id = auth.uid()) < 3);

CREATE POLICY "Learners update own attempts" ON public.quiz_attempts FOR UPDATE TO authenticated
USING (auth.uid() = learner_id);

CREATE POLICY "View attempts" ON public.quiz_attempts FOR SELECT TO authenticated
USING (auth.uid() = learner_id OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id WHERE q.id = quiz_attempts.quiz_id AND c.teacher_id = auth.uid()));

-- Answers policies
CREATE POLICY "Learners manage own answers" ON public.attempt_answers FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = attempt_answers.attempt_id AND a.learner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = attempt_answers.attempt_id AND a.learner_id = auth.uid()));

CREATE POLICY "View answers" ON public.attempt_answers FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = attempt_answers.attempt_id
  AND (a.learner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id WHERE q.id = a.quiz_id AND c.teacher_id = auth.uid()))));
