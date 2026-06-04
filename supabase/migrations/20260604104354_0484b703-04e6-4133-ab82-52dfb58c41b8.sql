ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS subjects_name_level_unique ON public.subjects (name, COALESCE(level, ''));