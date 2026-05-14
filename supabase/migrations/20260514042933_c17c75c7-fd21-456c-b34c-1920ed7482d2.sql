
CREATE TABLE public.vark_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  visual integer NOT NULL DEFAULT 0,
  aural integer NOT NULL DEFAULT 0,
  read_write integer NOT NULL DEFAULT 0,
  kinesthetic integer NOT NULL DEFAULT 0,
  dominant text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vark_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners manage own vark results"
ON public.vark_results FOR ALL TO authenticated
USING (auth.uid() = learner_id)
WITH CHECK (auth.uid() = learner_id);

CREATE POLICY "Teachers and admins view vark results"
ON public.vark_results FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_vark_results_learner ON public.vark_results(learner_id, created_at DESC);
