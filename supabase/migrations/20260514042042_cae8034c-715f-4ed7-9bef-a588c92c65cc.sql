DROP POLICY IF EXISTS "Learners create own attempts" ON public.quiz_attempts;

CREATE POLICY "Learners create own attempts"
ON public.quiz_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = learner_id AND attempt_number >= 1);