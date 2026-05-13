
CREATE POLICY "Users self-assign learner or teacher" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role IN ('learner','teacher'));
