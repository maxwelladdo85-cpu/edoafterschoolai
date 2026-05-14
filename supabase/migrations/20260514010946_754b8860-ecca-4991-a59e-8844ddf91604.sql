-- Extend lesson content type to include Word/doc files
ALTER TYPE public.lesson_content_type ADD VALUE IF NOT EXISTS 'doc';

-- Create a public bucket for course materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Course materials are viewable by authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Teachers upload to own course folder" ON storage.objects;
DROP POLICY IF EXISTS "Teachers update own course materials" ON storage.objects;
DROP POLICY IF EXISTS "Teachers delete own course materials" ON storage.objects;

CREATE POLICY "Course materials are viewable by authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'course-materials');

CREATE POLICY "Teachers upload to own course folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials'
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Teachers update own course materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Teachers delete own course materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);