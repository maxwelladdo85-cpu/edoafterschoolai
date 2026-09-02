CREATE POLICY "Recipients can delete messages sent to them"
ON public.direct_messages
FOR DELETE
TO authenticated
USING (auth.uid() = recipient_id);