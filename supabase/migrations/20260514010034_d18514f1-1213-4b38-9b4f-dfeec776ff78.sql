DROP POLICY IF EXISTS "Anyone authenticated views active courses" ON public.courses;
CREATE POLICY "Authenticated users view all courses"
ON public.courses FOR SELECT
TO authenticated
USING (true);