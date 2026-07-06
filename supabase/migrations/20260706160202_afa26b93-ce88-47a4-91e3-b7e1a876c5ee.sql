-- Let teachers view all virtual classes (so scripter/admin-scheduled classes are visible to them)
DROP POLICY IF EXISTS "View virtual classes" ON public.virtual_classes;
CREATE POLICY "View virtual classes" ON public.virtual_classes
FOR SELECT USING (
  (teacher_id = auth.uid())
  OR public.is_content_manager(auth.uid())
  OR public.has_role(auth.uid(), 'teacher')
  OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = virtual_classes.course_id AND e.learner_id = auth.uid())
);

-- Notify all teachers when a virtual class is scheduled by a scripter or admin
CREATE OR REPLACE FUNCTION public.notify_teachers_of_virtual_class()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course text;
BEGIN
  -- Only notify when the creator is a scripter or admin (not a teacher scheduling their own class)
  IF NOT public.is_content_manager(NEW.teacher_id) THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_course FROM public.courses WHERE id = NEW.course_id;

  INSERT INTO public.notifications (user_id, title, message)
  SELECT ur.user_id,
         'New virtual class scheduled',
         'A new Zoom class "' || NEW.title || '" for ' || COALESCE(v_course,'a course') ||
         ' is scheduled for ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY HH24:MI') ||
         '. Link: ' || NEW.zoom_url
  FROM public.user_roles ur
  WHERE ur.role = 'teacher';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_teachers_of_virtual_class ON public.virtual_classes;
CREATE TRIGGER trg_notify_teachers_of_virtual_class
AFTER INSERT ON public.virtual_classes
FOR EACH ROW EXECUTE FUNCTION public.notify_teachers_of_virtual_class();