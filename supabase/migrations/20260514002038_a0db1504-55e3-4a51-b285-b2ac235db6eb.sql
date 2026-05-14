CREATE POLICY "View teacher and admin profiles" ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(id, 'teacher') OR public.has_role(id, 'admin'));