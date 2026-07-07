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
  ELSIF EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text = 'scripter') THEN
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
      SELECT sub.id, sub.full_name, sub.email, sub.role
      FROM (
        SELECT DISTINCT p.id, p.full_name, p.email, 'learner'::text AS role
        FROM public.courses c
        JOIN public.enrollments e ON e.course_id = c.id
        JOIN public.profiles p ON p.id = e.learner_id
        WHERE c.teacher_id = auth.uid()
        UNION
        SELECT p.id, p.full_name, p.email,
          CASE WHEN public.has_role(p.id,'admin') THEN 'admin' ELSE 'scripter' END AS role
        FROM public.profiles p
        WHERE p.id <> auth.uid()
          AND (
            public.has_role(p.id,'admin')
            OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role::text = 'scripter')
          )
      ) sub
      ORDER BY sub.full_name NULLS LAST;
  ELSE
    RETURN QUERY
      SELECT DISTINCT p.id, p.full_name, p.email, 'teacher'::text
      FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
      WHERE ur.role::text = 'teacher'
      ORDER BY p.full_name NULLS LAST;
  END IF;
END;
$function$;