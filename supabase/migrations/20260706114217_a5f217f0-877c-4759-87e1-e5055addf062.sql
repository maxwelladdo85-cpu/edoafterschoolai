-- Allow handle_new_user to grant scripter role from signup metadata,
-- and backfill the scripter role for the existing scripter account.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'learner')
  ON CONFLICT (user_id, role) DO NOTHING;

  v_role := NULLIF(trim(coalesce(NEW.raw_user_meta_data->>'signup_role','')), '');
  IF v_role = 'scripter' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'scripter')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Backfill: grant scripter role to the existing account that signed up as scripter
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'scripter'::app_role FROM public.profiles WHERE email = 'maxwelladdo85@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;