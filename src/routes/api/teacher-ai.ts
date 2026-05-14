import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type Tool = "quiz" | "lesson_plan" | "summary" | "grading";

function buildPrompt(tool: Tool, payload: any): { system: string; user: string } {
  switch (tool) {
    case "quiz":
      return {
        system:
          "You are an expert Nigerian secondary-school teacher creating high-quality multiple-choice questions for Edo After School learners. Always respond in valid JSON only, no prose.",
        user: `From the lesson text below, generate exactly 10 multiple-choice questions. Return JSON of shape:
{"questions":[{"question":"...","options":["A","B","C","D"],"answer":"A","explanation":"..."}]}
Each question must have 4 options, one correct answer letter (A-D), and a short explanation.

LESSON TEXT:
"""${String(payload.text || "").slice(0, 8000)}"""`,
      };
    case "lesson_plan":
      return {
        system:
          "You are a curriculum designer for Edo After School. Produce clear, structured lesson plans aligned to Nigerian secondary curriculum.",
        user: `Create a structured lesson plan in Markdown.
Topic: ${payload.topic}
Duration: ${payload.duration} minutes

Include: Learning objectives, Materials, Introduction (with timing), Main activities (with timing), Guided practice, Assessment, Homework, and Differentiation tips.`,
      };
    case "summary":
      return {
        system:
          "You summarise documents into clear, student-friendly notes for Nigerian secondary students. Use simple language and short paragraphs.",
        user: `Summarise the document below for students. Use Markdown with: a TL;DR, Key Concepts (bulleted), Important Definitions, and 3 quick review questions.

DOCUMENT:
"""${String(payload.text || "").slice(0, 12000)}"""`,
      };
    case "grading":
      return {
        system:
          "You are a fair and constructive teacher assistant grading essay answers. You suggest a mark — the human teacher decides.",
        user: `Grade the student's answer against the criteria. Return Markdown with:
- **Suggested mark** (e.g. 7/10)
- **Strengths**
- **Areas to improve**
- **Specific feedback to the student** (2-4 sentences, encouraging)

MARKING CRITERIA:
"""${String(payload.criteria || "")}"""

STUDENT ANSWER:
"""${String(payload.answer || "")}"""`,
      };
  }
}

export const Route = createFileRoute("/api/teacher-ai")({
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

          // Teacher or admin only
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userData.user.id);
          const allowed = (roles ?? []).some((r: any) => r.role === "teacher" || r.role === "admin");
          if (!allowed) return new Response("Forbidden", { status: 403 });

          const body = await request.json();
          const tool = body.tool as Tool;
          if (!["quiz", "lesson_plan", "summary", "grading"].includes(tool)) {
            return new Response("Bad request", { status: 400 });
          }

          const { system, user } = buildPrompt(tool, body);
          const wantsJson = tool === "quiz";

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              ...(wantsJson ? { response_format: { type: "json_object" } } : {}),
            }),
          });

          if (!upstream.ok) {
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
            console.error("teacher-ai upstream error", upstream.status, txt);
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "content-type": "application/json" },
            });
          }

          const json = await upstream.json();
          const content: string = json.choices?.[0]?.message?.content ?? "";

          if (wantsJson) {
            try {
              const parsed = JSON.parse(content);
              return Response.json({ tool, data: parsed });
            } catch {
              return Response.json({ tool, data: { raw: content } });
            }
          }

          return Response.json({ tool, content });
        } catch (e) {
          console.error("teacher-ai error", e);
          return new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
