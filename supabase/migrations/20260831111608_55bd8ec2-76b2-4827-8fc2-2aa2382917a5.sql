DROP INDEX IF EXISTS public.profiles_teacher_id_unique;
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_id ON public.profiles (lower(trim(teacher_id))) WHERE teacher_id IS NOT NULL;