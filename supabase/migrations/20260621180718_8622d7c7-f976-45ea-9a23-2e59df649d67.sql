
-- 1. Extend profiles with USSD fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS ussd_pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS ussd_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON public.profiles (phone) WHERE phone IS NOT NULL;

-- 2. ussd_sessions
CREATE TABLE IF NOT EXISTS public.ussd_sessions (
  session_id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  learner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.ussd_sessions TO service_role;
ALTER TABLE public.ussd_sessions ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (which bypasses RLS) can access.

CREATE INDEX IF NOT EXISTS ussd_sessions_phone_idx ON public.ussd_sessions(phone);
CREATE INDEX IF NOT EXISTS ussd_sessions_updated_idx ON public.ussd_sessions(updated_at);

CREATE TRIGGER ussd_sessions_updated_at
  BEFORE UPDATE ON public.ussd_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. sms_log
CREATE TABLE IF NOT EXISTS public.sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  learner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  purpose TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sms_log TO authenticated;
GRANT ALL ON public.sms_log TO service_role;
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view SMS log"
  ON public.sms_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS sms_log_phone_idx ON public.sms_log(phone);
CREATE INDEX IF NOT EXISTS sms_log_created_idx ON public.sms_log(created_at DESC);

CREATE TRIGGER sms_log_updated_at
  BEFORE UPDATE ON public.sms_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Helper: expire old USSD sessions (called at the start of each request)
CREATE OR REPLACE FUNCTION public.ussd_expire_old_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.ussd_sessions WHERE updated_at < now() - INTERVAL '5 minutes';
$$;
