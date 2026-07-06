
-- 1. Add the new enum value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'scripter';

-- 2. Helper: is this user allowed to manage course content? (admin OR scripter)
--    Uses text cast so the freshly added enum value doesn't need to be resolved
--    inside the same migration transaction.
CREATE OR REPLACE FUNCTION public.is_content_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin','scripter')
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_content_manager(uuid) TO anon, authenticated;

-- 3. Recreate content-management policies so scripter has the same powers as admin.

-- courses
DROP POLICY IF EXISTS "Teachers create courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers update own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers delete own courses" ON public.courses;

CREATE POLICY "Content creators create courses" ON public.courses
FOR INSERT WITH CHECK (
  (auth.uid() = teacher_id) AND (
    public.has_role(auth.uid(),'teacher')
    OR public.is_content_manager(auth.uid())
  )
);
CREATE POLICY "Owners update courses" ON public.courses
FOR UPDATE USING ((teacher_id = auth.uid()) OR public.is_content_manager(auth.uid()));
CREATE POLICY "Owners delete courses" ON public.courses
FOR DELETE USING ((teacher_id = auth.uid()) OR public.is_content_manager(auth.uid()));

-- modules
DROP POLICY IF EXISTS "Teachers manage own course modules" ON public.modules;
DROP POLICY IF EXISTS "View modules of viewable courses" ON public.modules;
CREATE POLICY "Manage modules" ON public.modules
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.courses c
  WHERE c.id = modules.course_id
    AND (c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
)) WITH CHECK (EXISTS (
  SELECT 1 FROM public.courses c
  WHERE c.id = modules.course_id
    AND (c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
));
CREATE POLICY "View modules" ON public.modules
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.courses c
  WHERE c.id = modules.course_id
    AND (c.is_active OR c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
));

-- lessons
DROP POLICY IF EXISTS "Teachers manage own course lessons" ON public.lessons;
DROP POLICY IF EXISTS "View lessons of viewable courses" ON public.lessons;
CREATE POLICY "Manage lessons" ON public.lessons
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id
  WHERE m.id = lessons.module_id
    AND (c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
)) WITH CHECK (EXISTS (
  SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id
  WHERE m.id = lessons.module_id
    AND (c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
));
CREATE POLICY "View lessons" ON public.lessons
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id
  WHERE m.id = lessons.module_id
    AND (c.is_active OR c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
));

-- quizzes
DROP POLICY IF EXISTS "Teachers manage own course quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "View quizzes of viewable courses" ON public.quizzes;
CREATE POLICY "Manage quizzes" ON public.quizzes
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.courses c
  WHERE c.id = quizzes.course_id
    AND (c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
)) WITH CHECK (EXISTS (
  SELECT 1 FROM public.courses c
  WHERE c.id = quizzes.course_id
    AND (c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
));
CREATE POLICY "View quizzes" ON public.quizzes
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.courses c
  WHERE c.id = quizzes.course_id
    AND (c.is_active OR c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
));

-- questions
DROP POLICY IF EXISTS "Teachers manage own quiz questions" ON public.questions;
DROP POLICY IF EXISTS "View questions of viewable quizzes" ON public.questions;
CREATE POLICY "Manage questions" ON public.questions
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id
  WHERE q.id = questions.quiz_id
    AND (c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
)) WITH CHECK (EXISTS (
  SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id
  WHERE q.id = questions.quiz_id
    AND (c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
));
CREATE POLICY "View questions" ON public.questions
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.quizzes q JOIN public.courses c ON c.id = q.course_id
  WHERE q.id = questions.quiz_id
    AND (c.is_active OR c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
));

-- question_choices
DROP POLICY IF EXISTS "Teachers manage own quiz choices" ON public.question_choices;
DROP POLICY IF EXISTS "View choices of viewable questions" ON public.question_choices;
CREATE POLICY "Manage choices" ON public.question_choices
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.questions qu JOIN public.quizzes q ON q.id = qu.quiz_id
    JOIN public.courses c ON c.id = q.course_id
  WHERE qu.id = question_choices.question_id
    AND (c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
)) WITH CHECK (EXISTS (
  SELECT 1 FROM public.questions qu JOIN public.quizzes q ON q.id = qu.quiz_id
    JOIN public.courses c ON c.id = q.course_id
  WHERE qu.id = question_choices.question_id
    AND (c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
));
CREATE POLICY "View choices" ON public.question_choices
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.questions qu JOIN public.quizzes q ON q.id = qu.quiz_id
    JOIN public.courses c ON c.id = q.course_id
  WHERE qu.id = question_choices.question_id
    AND (c.is_active OR c.teacher_id = auth.uid() OR public.is_content_manager(auth.uid()))
));

-- virtual_classes
DROP POLICY IF EXISTS "Teachers manage own virtual classes" ON public.virtual_classes;
DROP POLICY IF EXISTS "Enrolled learners view virtual classes" ON public.virtual_classes;
CREATE POLICY "Manage virtual classes" ON public.virtual_classes
FOR ALL USING ((teacher_id = auth.uid()) OR public.is_content_manager(auth.uid()))
WITH CHECK ((teacher_id = auth.uid()) OR public.is_content_manager(auth.uid()));
CREATE POLICY "View virtual classes" ON public.virtual_classes
FOR SELECT USING (
  (teacher_id = auth.uid())
  OR public.is_content_manager(auth.uid())
  OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = virtual_classes.course_id AND e.learner_id = auth.uid())
);

-- 4. Update messaging directory so scripters can chat with admins + teachers, and
--    teachers gain admins + scripters as contacts.
CREATE OR REPLACE FUNCTION public.list_messageable_users()
RETURNS TABLE(user_id uuid, full_name text, email text, role text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
      SELECT p.id, p.full_name, p.email,
        CASE WHEN public.has_role(p.id,'admin') THEN 'admin'
             WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role::text = 'scripter') THEN 'scripter'
             WHEN public.has_role(p.id,'teacher') THEN 'teacher'
             ELSE 'learner' END
      FROM public.profiles p
      WHERE p.id <> auth.uid()
      ORDER BY p.full_name NULLS LAST;
  ELSIF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'scripter') THEN
    RETURN QUERY
      SELECT p.id, p.full_name, p.email,
        CASE WHEN public.has_role(p.id,'admin') THEN 'admin'
             WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role::text = 'scripter') THEN 'scripter'
             ELSE 'teacher' END
      FROM public.profiles p
      WHERE p.id <> auth.uid()
        AND (
          public.has_role(p.id,'admin')
          OR public.has_role(p.id,'teacher')
          OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role::text = 'scripter')
        )
      ORDER BY p.full_name NULLS LAST;
  ELSIF public.has_role(auth.uid(), 'teacher') THEN
    RETURN QUERY
      -- own learners
      SELECT DISTINCT p.id, p.full_name, p.email, 'learner'::text
      FROM public.courses c
      JOIN public.enrollments e ON e.course_id = c.id
      JOIN public.profiles p ON p.id = e.learner_id
      WHERE c.teacher_id = auth.uid()
      UNION
      -- admins and scripters
      SELECT p.id, p.full_name, p.email,
        CASE WHEN public.has_role(p.id,'admin') THEN 'admin' ELSE 'scripter' END
      FROM public.profiles p
      WHERE p.id <> auth.uid()
        AND (
          public.has_role(p.id,'admin')
          OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role::text = 'scripter')
        )
      ORDER BY full_name NULLS LAST;
  ELSE
    -- Learner: any teacher
    RETURN QUERY
      SELECT DISTINCT p.id, p.full_name, p.email, 'teacher'::text
      FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
      WHERE ur.role = 'teacher'
      ORDER BY p.full_name NULLS LAST;
  END IF;
END;
$function$;
