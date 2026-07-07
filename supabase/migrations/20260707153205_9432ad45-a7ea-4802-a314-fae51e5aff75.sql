CREATE OR REPLACE FUNCTION public.notify_teachers_of_virtual_class()
RETURNS TRIGGER
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
  WHERE ur.role IN ('teacher', 'admin');

  RETURN NEW;
END;
$$;