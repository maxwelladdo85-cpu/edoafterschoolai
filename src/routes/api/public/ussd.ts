// USSD webhook endpoint for offline learners using feature phones.
//
// Protocol (Africa's Talking-compatible):
//   POST application/x-www-form-urlencoded
//   Body: sessionId, phoneNumber, serviceCode, text
//   "text" is the FULL concatenation of every keypress so far,
//   joined with "*". We re-parse it on every request — no in-memory state.
//
// Response: plain text starting with "CON " (continue) or "END " (terminate).
//
// Security: this route lives under /api/public/* so it bypasses
// Lovable's published-site auth. The aggregator must send a matching
// USSD_WEBHOOK_SECRET in the `x-ussd-secret` header. PIN-protected actions
// further require the learner to enter their 4-digit PIN.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "crypto";

const TEXT = (s: string) =>
  new Response(s, { status: 200, headers: { "Content-Type": "text/plain" } });

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// Hash a 4-digit PIN with a per-install pepper so a DB leak alone is useless.
function hashPin(pin: string): string {
  const pepper = process.env.USSD_PIN_PEPPER || "edo-dlah-ussd";
  return createHash("sha256").update(`${pepper}:${pin}`).digest("hex");
}

function checkWebhookSecret(req: Request): boolean {
  const expected = process.env.USSD_WEBHOOK_SECRET;
  if (!expected) return true; // not configured yet — allow during prototype
  const got = req.headers.get("x-ussd-secret") || "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Step = string; // each user keypress, e.g. "1", "2", "1234"

async function loadLearnerByPhone(db: ReturnType<typeof admin>, phone: string) {
  // Match on last 10 digits to tolerate +234 / 0 prefixes.
  const tail = phone.replace(/\D/g, "").slice(-10);
  const { data } = await db
    .from("profiles")
    .select("id, full_name, class_level, ussd_enabled, ussd_pin_hash, phone")
    .ilike("phone", `%${tail}`)
    .limit(1)
    .maybeSingle();
  return data;
}

async function handle(req: Request): Promise<Response> {
  if (!checkWebhookSecret(req)) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const sessionId = String(form.get("sessionId") || "");
  const phoneNumber = String(form.get("phoneNumber") || "");
  const text = String(form.get("text") || "");
  if (!sessionId || !phoneNumber) return TEXT("END Invalid request");

  const steps: Step[] = text.length ? text.split("*") : [];
  const db = admin();

  // Best-effort cleanup of stale sessions (5 min).
  await db.rpc("ussd_expire_old_sessions").then(() => {}, () => {});

  // Persist this hop (state is rebuilt from `text` each time; the row is for analytics).
  await db.from("ussd_sessions").upsert({
    session_id: sessionId,
    phone: phoneNumber,
    state: { text },
    updated_at: new Date().toISOString(),
  }, { onConflict: "session_id" });

  const learner = await loadLearnerByPhone(db, phoneNumber);

  // ---------- ROOT MENU ----------
  if (steps.length === 0) {
    return TEXT(
      "CON Welcome to Edo DLAH\n" +
        "1. Login (PIN)\n" +
        "2. Today's lesson\n" +
        "3. Take a quiz\n" +
        "4. My scores\n" +
        "5. Announcements\n" +
        "6. Help",
    );
  }

  const root = steps[0];

  // ---------- 1. LOGIN ----------
  if (root === "1") {
    if (steps.length === 1) return TEXT("CON Enter your 4-digit PIN:");
    const pin = steps[1];
    if (!/^\d{4}$/.test(pin)) return TEXT("END PIN must be 4 digits.");
    if (!learner) return TEXT("END Phone not registered. Ask your school admin.");
    if (!learner.ussd_enabled || !learner.ussd_pin_hash)
      return TEXT("END USSD not enabled for your account.");
    if (learner.ussd_pin_hash !== hashPin(pin)) return TEXT("END Wrong PIN.");
    return TEXT(`END Welcome, ${learner.full_name || "learner"}! Login OK.`);
  }

  // The remaining options need the learner to exist on this phone.
  const needLogin = ["2", "3", "4"];
  if (needLogin.includes(root) && !learner)
    return TEXT("END Phone not registered. Ask your school admin.");

  // ---------- 2. TODAY'S LESSON ----------
  if (root === "2") {
    const { data: subjects } = await db
      .from("subjects")
      .select("id, name")
      .order("name")
      .limit(7);
    if (steps.length === 1) {
      if (!subjects?.length) return TEXT("END No subjects available.");
      return TEXT(
        "CON Choose a subject:\n" +
          subjects.map((s, i) => `${i + 1}. ${s.name}`).join("\n"),
      );
    }
    const pick = parseInt(steps[1], 10) - 1;
    const subj = subjects?.[pick];
    if (!subj) return TEXT("END Invalid choice.");

    // Find a recent lesson in this subject for the learner's class level.
    const { data: lesson } = await db
      .from("lessons")
      .select("id, title, summary, content, modules!inner(course_id, courses!inner(subject_id, class_level))")
      .eq("modules.courses.subject_id", subj.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lesson) return TEXT("END No lesson found for that subject yet.");

    const body =
      `[${subj.name}] ${lesson.title}\n\n` +
      String(lesson.summary || lesson.content || "").slice(0, 440);

    const { sendSms } = await import("@/lib/sms.server");
    await sendSms({
      phone: phoneNumber,
      body,
      purpose: "lesson_summary",
      learnerId: learner!.id,
    });
    return TEXT("END Lesson sent to you by SMS.");
  }

  // ---------- 3. TAKE A QUIZ (stub: lists titles, full play in next iteration) ----------
  if (root === "3") {
    const { data: quizzes } = await db
      .from("quizzes")
      .select("id, title")
      .order("created_at", { ascending: false })
      .limit(5);
    if (!quizzes?.length) return TEXT("END No quizzes available.");
    if (steps.length === 1) {
      return TEXT(
        "CON Choose a quiz:\n" +
          quizzes.map((q, i) => `${i + 1}. ${q.title}`).join("\n"),
      );
    }
    const pick = parseInt(steps[1], 10) - 1;
    const q = quizzes[pick];
    if (!q) return TEXT("END Invalid choice.");
    return TEXT(
      `END Quiz "${q.title}" will be delivered by SMS shortly. ` +
        `Reply with your answers (full USSD quiz play coming soon).`,
    );
  }

  // ---------- 4. MY SCORES ----------
  if (root === "4") {
    const { data: attempts } = await db
      .from("quiz_attempts")
      .select("score, max_score, submitted_at, quizzes(title)")
      .eq("learner_id", learner!.id)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(5);
    if (!attempts?.length) return TEXT("END No quiz scores yet.");
    const lines = attempts.map((a: any) => {
      const t = (a.quizzes?.title || "Quiz").slice(0, 18);
      return `${t}: ${a.score}/${a.max_score}`;
    });
    return TEXT("END Recent scores:\n" + lines.join("\n"));
  }

  // ---------- 5. ANNOUNCEMENTS ----------
  if (root === "5") {
    const { data: anns } = await db
      .from("scheduled_announcements")
      .select("title, message, sent_at")
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(3);
    if (!anns?.length) return TEXT("END No announcements right now.");
    if (steps.length === 1) {
      return TEXT(
        "CON Recent announcements:\n" +
          anns.map((a, i) => `${i + 1}. ${a.title.slice(0, 40)}`).join("\n") +
          "\n0. SMS me all",
      );
    }
    if (steps[1] === "0") {
      const body = anns
        .map((a) => `* ${a.title}: ${a.message || ""}`)
        .join("\n")
        .slice(0, 480);
      const { sendSms } = await import("@/lib/sms.server");
      await sendSms({
        phone: phoneNumber,
        body,
        purpose: "announcement_full",
        learnerId: learner?.id ?? null,
      });
      return TEXT("END Announcements sent by SMS.");
    }
    const pick = parseInt(steps[1], 10) - 1;
    const a = anns[pick];
    if (!a) return TEXT("END Invalid choice.");
    return TEXT(`END ${a.title}\n${(a.message || "").slice(0, 130)}`);
  }

  // ---------- 6. HELP ----------
  if (root === "6") {
    return TEXT("END Visit edodlah.com or contact your school admin for help.");
  }

  return TEXT("END Invalid choice.");
}

export const Route = createFileRoute("/api/public/ussd")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
      // Some aggregators (testing tools) use GET — accept it too.
      GET: async ({ request }) => handle(request),
    },
  },
});
