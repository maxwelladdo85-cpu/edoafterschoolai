
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT ALL ON public.subjects TO service_role;

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subjects"
ON public.subjects FOR SELECT
USING (is_active OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage subjects"
ON public.subjects FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.subjects (name) VALUES
  ('English Studies'),
  ('Mathematics'),
  ('Basic Science and Technology'),
  ('Social Studies'),
  ('Civic Education'),
  ('Cultural and Creative Arts'),
  ('Christian Religious Studies'),
  ('Islamic Religious Studies'),
  ('Physical and Health Education'),
  ('Computer Studies / ICT'),
  ('Agricultural Science'),
  ('Home Economics'),
  ('Nigerian Languages (Edo)'),
  ('French'),
  ('History'),
  ('Security Education')
ON CONFLICT (name) DO NOTHING;
