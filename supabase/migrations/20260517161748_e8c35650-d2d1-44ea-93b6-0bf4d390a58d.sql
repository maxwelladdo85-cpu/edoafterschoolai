
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;

CREATE OR REPLACE FUNCTION public.send_birthday_greeting_if_due()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dob date;
  v_name text;
  v_title text;
  v_already int;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT date_of_birth, COALESCE(full_name, email, 'there')
    INTO v_dob, v_name
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_dob IS NULL THEN
    RETURN false;
  END IF;

  IF EXTRACT(MONTH FROM v_dob) <> EXTRACT(MONTH FROM CURRENT_DATE)
     OR EXTRACT(DAY FROM v_dob) <> EXTRACT(DAY FROM CURRENT_DATE) THEN
    RETURN false;
  END IF;

  v_title := 'Happy Birthday, ' || v_name || '! 🎉 (' || EXTRACT(YEAR FROM CURRENT_DATE)::text || ')';

  SELECT count(*) INTO v_already
  FROM public.notifications
  WHERE user_id = auth.uid() AND title = v_title;

  IF v_already > 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.notifications (user_id, title, message)
  VALUES (
    auth.uid(),
    v_title,
    'The whole Edo SUBEB Digital Learning team wishes you a fantastic birthday. Keep learning and shining! 🎂'
  );
  RETURN true;
END;
$$;
