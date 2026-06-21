// Server-only SMS helper. Currently STUBBED: writes every outgoing SMS to
// public.sms_log instead of contacting a real aggregator. Once an aggregator
// account (e.g. Africa's Talking) is provisioned, replace `sendViaProvider`
// with a real HTTP call and keep the sms_log insert for auditing.
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type SmsPurpose =
  | "lesson_summary"
  | "quiz_result"
  | "announcement_full"
  | "scores_report"
  | "system";

// Split a long body into 160-char SMS parts (GSM-7 assumption is fine for v1).
function splitParts(body: string, max = 160): string[] {
  const parts: string[] = [];
  let s = body.trim();
  while (s.length > max) {
    parts.push(s.slice(0, max));
    s = s.slice(max);
  }
  if (s.length) parts.push(s);
  return parts;
}

async function sendViaProvider(_phone: string, _body: string): Promise<{ id: string | null }> {
  // TODO: wire to Africa's Talking / Termii SMS API here.
  return { id: null };
}

export async function sendSms(opts: {
  phone: string;
  body: string;
  purpose: SmsPurpose;
  learnerId?: string | null;
}): Promise<{ logged: number }> {
  const db = admin();
  const parts = splitParts(opts.body);
  let logged = 0;
  for (const part of parts) {
    let status = "queued";
    let providerId: string | null = null;
    let errMsg: string | null = null;
    try {
      const r = await sendViaProvider(opts.phone, part);
      providerId = r.id;
      status = providerId ? "sent" : "stubbed";
    } catch (e) {
      status = "failed";
      errMsg = e instanceof Error ? e.message : String(e);
    }
    await db.from("sms_log").insert({
      phone: opts.phone,
      learner_id: opts.learnerId ?? null,
      body: part,
      purpose: opts.purpose,
      provider_message_id: providerId,
      status,
      error: errMsg,
    });
    logged++;
  }
  return { logged };
}
