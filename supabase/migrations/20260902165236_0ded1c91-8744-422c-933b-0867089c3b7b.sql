CREATE POLICY "Learners can delete their own certificates"
ON public.certificates
FOR DELETE
TO authenticated
USING (auth.uid() = learner_id);