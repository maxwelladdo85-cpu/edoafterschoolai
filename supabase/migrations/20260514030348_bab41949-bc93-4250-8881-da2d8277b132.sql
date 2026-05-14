DROP POLICY IF EXISTS "Admins create notifications" ON public.notifications;

CREATE POLICY "Staff create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'teacher')
  OR auth.uid() = user_id
);