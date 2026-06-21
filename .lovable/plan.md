## Goal

Give learners without internet access a way to use Edo SUBEB DLAH from any basic phone via a USSD shortcode (e.g. `*347*EDU#`), with SMS used for anything longer than a single USSD screen.

The existing web/mobile app stays the full experience for connected users. USSD is a parallel, text-only channel that talks to the same Lovable Cloud database.

## Architecture

```text
 Feature phone  ──dial *347*EDU#──►  MNO (MTN/Airtel/Glo/9mobile)
                                          │
                                          ▼
                                 USSD aggregator
                              (Africa's Talking / Termii)
                                          │  HTTPS webhook (per keypress)
                                          ▼
              POST /api/public/ussd  ── TanStack server route on Lovable Cloud
                                          │
                                          ▼
                              Supabase (profiles, courses,
                              quizzes, ussd_sessions, sms_log)
                                          │
                                          ▼
                              SMS send (aggregator API) for
                              long content + result receipts
```

Key properties:
- One stateless HTTP endpoint receives every keypress; session state lives in a `ussd_sessions` table keyed by the aggregator's `sessionId`.
- Phone number → learner account match via `profiles.phone` (new column, unique).
- Each menu screen ≤ 160 characters, ≤ 7 options. Anything longer is sent as SMS.

## Aggregator choice

Recommend **Africa's Talking** for Nigeria coverage on all 4 MNOs, a single sandbox shortcode for testing, simple `application/x-www-form-urlencoded` webhook, and a matching SMS API on the same account. Termii is the fallback (stronger SMS, USSD via partner shortcodes).

Decision needed from you: confirm Africa's Talking, or name a preferred aggregator/MNO contact.

## Menu tree (v1)

```text
CON Welcome to Edo DLAH
1. Login (PIN)
2. Today's lesson
3. Take a quiz
4. My scores
5. Announcements
6. Help

  └ 1 Login
      CON Enter your 4-digit PIN:
      → verify against profiles.ussd_pin (hashed)
      → on success, store learner_id on session

  └ 2 Today's lesson         (requires login)
      → pick subject  →  pick class
      → SMS lesson summary (≤ 480 chars / 3 SMS parts)
      END "Lesson sent by SMS."

  └ 3 Take a quiz            (requires login)
      → pick subject → pick quiz (max 5 questions, text only)
      CON Q1: 2 + 2 = ?
          1) 3   2) 4   3) 5
      → record answers in quiz_attempts
      END "Score: 4/5. Details sent by SMS."

  └ 4 My scores              (requires login)
      → last 5 attempts, one line each
      END (or "More" → SMS full report)

  └ 5 Announcements          (no login)
      → 3 most recent active scheduled_announcements (title only)
      → "0" send full text by SMS

  └ 6 Help
      END "Call 0800-EDO-SUBEB or visit edodlah.com"
```

`CON` = continue session, `END` = terminate — the Africa's Talking convention.

## Database changes (one migration)

- `profiles`: add `phone TEXT UNIQUE`, `ussd_pin_hash TEXT`, `ussd_enabled BOOLEAN DEFAULT false`.
- `ussd_sessions` (new): `session_id TEXT PK`, `phone TEXT`, `learner_id UUID NULL`, `state JSONB`, `created_at`, `updated_at`. RLS: service_role only.
- `sms_log` (new): `id`, `phone`, `body`, `purpose`, `provider_message_id`, `status`, `created_at`. RLS: service_role only; admins can SELECT via `has_role('admin')`.
- Trigger: auto-expire `ussd_sessions` older than 5 minutes.

All tables get `GRANT` blocks per project rules.

## Backend code

- `src/routes/api/public/ussd.ts` — TanStack server route, `POST` handler:
  - Parse `sessionId`, `phoneNumber`, `text` from the aggregator.
  - Load/create row in `ussd_sessions`.
  - Route through the menu tree above and return `CON ...` or `END ...` plain text.
  - Loads `supabaseAdmin` inside the handler (never at module scope).
  - Verifies request origin via a shared secret in a custom header set on the aggregator dashboard.
- `src/lib/sms.server.ts` — thin wrapper around the aggregator's SMS API, used to send lesson summaries, quiz results, and full announcement bodies. Logs every send to `sms_log`.
- `src/routes/api/public/sms-delivery.ts` — webhook receiving delivery reports from the aggregator; updates `sms_log.status`.

## Admin UI additions (small, optional this round)

- New page `src/routes/admin-ussd.tsx` (admin-only):
  - Toggle `ussd_enabled` per learner, set/reset 4-digit PIN.
  - View `sms_log` (recent 100, filter by phone).
  - View active `ussd_sessions` count.

## Secrets to add (later, only after you confirm aggregator)

- `AT_USERNAME`, `AT_API_KEY` (Africa's Talking)
- `AT_SHORTCODE`, `AT_SMS_SENDER_ID`
- `USSD_WEBHOOK_SECRET` (shared header value)

I will request these via the secrets tool only after you confirm the aggregator — not now.

## Out of scope for v1 (will note as follow-ups)

- Voice IVR, WhatsApp channel, multi-language menus (English-only first; Edo/Pidgin can follow).
- Video / virtual classes / file uploads — not feasible over USSD.
- Payments via USSD.

## Open questions before I build

1. Aggregator: Africa's Talking, Termii, or another (e.g. existing MNO contract)?
2. Should learners self-register via USSD (Option 0: "Register") using their phone + school code, or is registration always done by the school admin on the web app?
3. SMS budget cap per learner per day (to protect spend)? Suggest 5 SMS/day default.

## Technical notes

- The endpoint must live at `/api/public/ussd` so it bypasses Lovable's published-site auth (aggregator has no Supabase JWT).
- Responses are `text/plain`, starting with `CON ` or `END `.
- Webhook verification: HMAC over the form body using `USSD_WEBHOOK_SECRET`, timing-safe compare; reject with 401 otherwise.
- PIN stored as bcrypt/argon2 hash, never plain text.
- All USSD reads/writes use `supabaseAdmin` (service role) because the request has no Supabase session — security is enforced by the webhook secret + PIN.
- Stateless: no in-memory session maps; everything is in `ussd_sessions`.

## Build sequence once approved

1. Migration (profiles columns + `ussd_sessions` + `sms_log` + grants + RLS).
2. `/api/public/ussd` route with the full menu tree, using a stubbed SMS sender that just writes to `sms_log` (no real SMS yet).
3. Local test script that simulates aggregator POSTs through the whole flow.
4. Admin USSD page.
5. Once you confirm aggregator + provide account: wire real SMS sending and delivery webhook, add the three secrets, give you the webhook URL to paste into the aggregator dashboard.
