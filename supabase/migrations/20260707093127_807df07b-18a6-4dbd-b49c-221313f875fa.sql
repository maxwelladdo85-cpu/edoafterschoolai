-- Remove incorrect scripter role from the learner account (NIN 11111111111).
-- This account signs in as a learner via NIN/phone, so it must not carry the scripter role.
DELETE FROM public.user_roles
WHERE user_id = '2718918f-f284-4a3f-ace4-efcbaafb97c8'
  AND role = 'scripter';

-- Update the new-user trigger so it no longer backfills the scripter role
-- to this specific learner email on future runs.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default learner role for every new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'learner')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Grant scripter role only when the signup form explicitly requested it
  IF (NEW.raw_user_meta_data->>'signup_role') = 'scripter' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'scripter')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;