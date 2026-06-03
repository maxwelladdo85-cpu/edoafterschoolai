import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/tutor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader) return new Response("Unauthorized", { status: 401 });

          const SUPABASE_URL = process.env.SUPABASE_URL!;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!LOVABLE_API_KEY) {
            return new Response(JSON.stringify({ error: "AI is not configured" }), {
              status: 500,
              headers: { "content-type": "application/json" },
            });
          }

          const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: { headers: { Authorization: authHeader } },
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: userData, error: userErr } = await supabase.auth.getUser();
          if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });
          const userId = userData.user.id;

          const body = await request.json();
          const courseId = String(body.courseId || "");
          const userMessage = String(body.message || "").trim();
          if (!courseId || !userMessage) {
            return new Response("Bad request", { status: 400 });
          }
          if (userMessage.length > 4000) {
            return new Response("Message too long", { status: 400 });
          }

          // Per-user rate limit: 10/minute, 100/hour, 7/day for learners
          const nowIso = new Date().toISOString();
          const minuteAgo = new Date(Date.now() - 60_000).toISOString();
          const hourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
          const dayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
          const [perMinuteRes, perHourRes, perDayRes] = await Promise.all([
            supabase
              .from("tutor_messages")
              .select("id", { count: "exact", head: true })
              .eq("learner_id", userId)
              .eq("role", "user")
              .gte("created_at", minuteAgo)
              .lte("created_at", nowIso),
            supabase
              .from("tutor_messages")
              .select("id", { count: "exact", head: true })
              .eq("learner_id", userId)
              .eq("role", "user")
              .gte("created_at", hourAgo)
              .lte("created_at", nowIso),
            supabase
              .from("tutor_messages")
              .select("id", { count: "exact", head: true })
              .eq("learner_id", userId)
              .eq("role", "user")
              .gte("created_at", dayAgo)
              .lte("created_at", nowIso),
          ]);
          if ((perDayRes.count ?? 0) >= 7) {
            return new Response(
              JSON.stringify({ error: "You've reached your daily limit of 7 tutor requests. Please come back tomorrow." }),
              { status: 429, headers: { "content-type": "application/json", "Retry-After": "86400" } },
            );
          }
          if ((perMinuteRes.count ?? 0) >= 10 || (perHourRes.count ?? 0) >= 100) {
            return new Response(
              JSON.stringify({ error: "You're sending messages too quickly. Please wait a moment." }),
              { status: 429, headers: { "content-type": "application/json", "Retry-After": "60" } },
            );
          }

          // Load course context (RLS will allow if learner is enrolled / teacher / admin)
          const { data: course } = await supabase
            .from("courses")
            .select("title, description")
            .eq("id", courseId)
            .maybeSingle();
          if (!course) return new Response("Course not found", { status: 404 });

          // Load learner's VARK result so tutor can adapt to their learning style
          const { data: vark } = await supabase
            .from("vark_results")
            .select("dominant, visual, aural, read_write, kinesthetic")
            .eq("learner_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Load prior history (last 20 messages)
          const { data: history } = await supabase
            .from("tutor_messages")
            .select("role, content")
            .eq("learner_id", userId)
            .eq("course_id", courseId)
            .order("created_at", { ascending: true })
            .limit(20);

          // Persist the user message
          await supabase.from("tutor_messages").insert({
            learner_id: userId,
            course_id: courseId,
            role: "user",
            content: userMessage,
          });

          const varkBlock = vark
            ? `\n\nThe learner's VARK learning style is **${vark.dominant}** (Visual ${vark.visual}, Aural ${vark.aural}, Read/Write ${vark.read_write}, Kinesthetic ${vark.kinesthetic}).
Adapt every answer to that style:
- visual → use diagrams, charts, emoji, mind-map structures, colour cues
- aural → use conversational phrasing, read-aloud cues, mnemonics, songs
- read_write → use clear written lists, definitions, summaries, full sentences
- kinesthetic → use real-life examples, step-by-step activities, hands-on practice tasks
Always briefly note ONE study tip that matches their style at the end of each answer.`
            : `\n\nThe learner has not yet taken the VARK quiz — gently encourage them to take it from their dashboard so you can personalise feedback.`;

          const systemPrompt = `You are a helpful AI tutor for Edo After School.

Only answer questions related to the current course: ${course.title}${course.description ? ` — ${course.description}` : ""}.

Help learners understand concepts, summarise lessons, generate practice questions, create study plans, and simplify difficult topics.

Keep answers short and student-friendly.${varkBlock}`;

          const messages = [
            { role: "system", content: systemPrompt },
            ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage },
          ];

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages,
              stream: true,
            }),
          });

          if (!upstream.ok || !upstream.body) {
            if (upstream.status === 429) {
              return new Response(JSON.stringify({ error: "Rate limit hit. Try again shortly." }), {
                status: 429,
                headers: { "content-type": "application/json" },
              });
            }
            if (upstream.status === 402) {
              return new Response(
                JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable Cloud." }),
                { status: 402, headers: { "content-type": "application/json" } },
              );
            }
            const txt = await upstream.text().catch(() => "");
            console.error("AI upstream error", upstream.status, txt);
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "content-type": "application/json" },
            });
          }

          // Tee the stream: forward to client AND collect to persist final assistant message
          const stream = new ReadableStream({
            async start(controller) {
              const reader = upstream.body!.getReader();
              const decoder = new TextDecoder();
              let buffer = "";
              let assistantText = "";
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  controller.enqueue(value);
                  buffer += decoder.decode(value, { stream: true });
                  let nl: number;
                  while ((nl = buffer.indexOf("\n")) !== -1) {
                    let line = buffer.slice(0, nl);
                    buffer = buffer.slice(nl + 1);
                    if (line.endsWith("\r")) line = line.slice(0, -1);
                    if (!line.startsWith("data: ")) continue;
                    const json = line.slice(6).trim();
                    if (json === "[DONE]") continue;
                    try {
                      const parsed = JSON.parse(json);
                      const delta = parsed.choices?.[0]?.delta?.content;
                      if (delta) assistantText += delta;
                    } catch {
                      /* partial chunk */
                    }
                  }
                }
              } catch (e) {
                console.error("stream error", e);
              } finally {
                controller.close();
                if (assistantText.trim()) {
                  await supabase.from("tutor_messages").insert({
                    learner_id: userId,
                    course_id: courseId,
                    role: "assistant",
                    content: assistantText,
                  });
                }
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache, no-transform",
            },
          });
        } catch (e) {
          console.error("tutor route error", e);
          return new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
