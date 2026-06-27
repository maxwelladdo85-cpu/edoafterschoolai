
CREATE OR REPLACE FUNCTION public.list_learners_in_class(p_class_level text)
RETURNS TABLE(user_id uuid, full_name text, email text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT p.id, p.full_name, p.email
  FROM public.profiles p
  WHERE p.class_level = trim(p_class_level)
    AND public.has_role(p.id, 'learner')
  ORDER BY p.full_name NULLS LAST;
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_learners_in_class(text) TO authenticated;
