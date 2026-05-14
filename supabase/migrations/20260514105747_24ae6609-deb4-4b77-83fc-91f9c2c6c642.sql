
-- Forum
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  author_id uuid NOT NULL,
  parent_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  title text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_forum_posts_course ON public.forum_posts(course_id, created_at DESC);
CREATE INDEX idx_forum_posts_parent ON public.forum_posts(parent_id);
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View forum of viewable courses" ON public.forum_posts
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.is_active OR c.teacher_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Authenticated post in forum" ON public.forum_posts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors delete own posts" ON public.forum_posts
FOR DELETE TO authenticated USING (
  auth.uid() = author_id OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
);

-- Direct messages
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dm_pair ON public.direct_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_dm_recipient ON public.direct_messages(recipient_id, created_at DESC);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view DMs" ON public.direct_messages
FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Senders create DMs" ON public.direct_messages
FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND sender_id <> recipient_id);
CREATE POLICY "Recipients update read state" ON public.direct_messages
FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);

-- Certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  course_id uuid NOT NULL,
  certificate_code text NOT NULL UNIQUE,
  learner_name text NOT NULL,
  course_name text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (learner_id, course_id)
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or course certificates" ON public.certificates
FOR SELECT TO authenticated USING (
  auth.uid() = learner_id OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
);
-- Public view is allowed via known certificate_code lookup using the same SELECT policy
-- (verifier must know the learner -- we'll lookup via server fn if needed)

-- Badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  code text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (learner_id, code)
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or staff badges" ON public.badges
FOR SELECT TO authenticated USING (
  auth.uid() = learner_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher')
);

-- Helper: award badge (idempotent)
CREATE OR REPLACE FUNCTION public.award_badge(_learner uuid, _code text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.badges (learner_id, code) VALUES (_learner, _code)
  ON CONFLICT (learner_id, code) DO NOTHING;
$$;

-- Trigger: lesson completion → first lesson badge + course completion check
CREATE OR REPLACE FUNCTION public.on_lesson_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_course_id uuid;
  v_total int;
  v_done int;
  v_learner_name text;
  v_course_name text;
  v_streak int;
  v_code text;
BEGIN
  PERFORM public.award_badge(NEW.learner_id, 'first_lesson');

  SELECT m.course_id INTO v_course_id
  FROM public.lessons l JOIN public.modules m ON m.id = l.module_id
  WHERE l.id = NEW.lesson_id;

  IF v_course_id IS NOT NULL THEN
    SELECT count(l.id) INTO v_total
    FROM public.lessons l JOIN public.modules m ON m.id = l.module_id
    WHERE m.course_id = v_course_id;

    SELECT count(DISTINCT lc.lesson_id) INTO v_done
    FROM public.lesson_completions lc
    JOIN public.lessons l ON l.id = lc.lesson_id
    JOIN public.modules m ON m.id = l.module_id
    WHERE m.course_id = v_course_id AND lc.learner_id = NEW.learner_id;

    IF v_total > 0 AND v_done >= v_total THEN
      SELECT COALESCE(full_name, email, 'Learner') INTO v_learner_name FROM public.profiles WHERE id = NEW.learner_id;
      SELECT title INTO v_course_name FROM public.courses WHERE id = v_course_id;

      v_code := 'CERT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
      INSERT INTO public.certificates (learner_id, course_id, certificate_code, learner_name, course_name)
      VALUES (NEW.learner_id, v_course_id, v_code, v_learner_name, COALESCE(v_course_name,'Course'))
      ON CONFLICT (learner_id, course_id) DO NOTHING;

      PERFORM public.award_badge(NEW.learner_id, 'first_course');
    END IF;
  END IF;

  -- 7-day streak based on lesson_views
  WITH days AS (
    SELECT DISTINCT viewed_at::date AS d FROM public.lesson_views WHERE learner_id = NEW.learner_id
  ), recent AS (
    SELECT count(*) AS c FROM days WHERE d > CURRENT_DATE - INTERVAL '7 days'
  )
  SELECT c INTO v_streak FROM recent;
  IF v_streak >= 7 THEN
    PERFORM public.award_badge(NEW.learner_id, 'streak_7');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_lesson_completion
AFTER INSERT ON public.lesson_completions
FOR EACH ROW EXECUTE FUNCTION public.on_lesson_completion();

-- Trigger: quiz attempts → first quiz passed badge
CREATE OR REPLACE FUNCTION public.on_quiz_submitted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.submitted_at IS NOT NULL AND NEW.max_score > 0 AND (NEW.score::numeric / NEW.max_score) >= 0.5 THEN
    PERFORM public.award_badge(NEW.learner_id, 'first_quiz');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_quiz_submitted
AFTER INSERT OR UPDATE ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.on_quiz_submitted();

-- Helper to list teachers a learner has via enrollments
CREATE OR REPLACE FUNCTION public.list_my_message_contacts()
RETURNS TABLE(user_id uuid, full_name text, email text, role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- learners: their course teachers
  SELECT DISTINCT p.id, p.full_name, p.email, 'teacher'::text
  FROM public.enrollments e
  JOIN public.courses c ON c.id = e.course_id
  JOIN public.profiles p ON p.id = c.teacher_id
  WHERE e.learner_id = auth.uid()
  UNION
  -- teachers: their enrolled learners
  SELECT DISTINCT p.id, p.full_name, p.email, 'learner'::text
  FROM public.courses c
  JOIN public.enrollments e ON e.course_id = c.id
  JOIN public.profiles p ON p.id = e.learner_id
  WHERE c.teacher_id = auth.uid();
$$;
