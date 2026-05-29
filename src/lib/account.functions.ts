import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      confirmEmail: z.string().min(1).max(320),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Block admins from self-deleting via this route (avoid lockout / requires admin tooling)
    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (adminRow) {
      throw new Error("Admin accounts cannot be self-deleted. Contact another administrator.");
    }

    const { data: target, error: targetErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("id", userId)
      .maybeSingle();
    if (targetErr) throw new Error(targetErr.message);
    if (!target) throw new Error("Account not found");

    if ((target.email ?? "").trim().toLowerCase() !== data.confirmEmail.trim().toLowerCase()) {
      throw new Error("Confirmation email does not match your account email");
    }

    const userScopedTables: { table: string; col: string }[] = [
      { table: "lesson_completions", col: "learner_id" },
      { table: "lesson_views", col: "learner_id" },
      { table: "quiz_attempts", col: "learner_id" },
      { table: "enrollments", col: "learner_id" },
      { table: "virtual_class_attendance", col: "learner_id" },
      { table: "badges", col: "learner_id" },
      { table: "certificates", col: "learner_id" },
      { table: "tutor_messages", col: "learner_id" },
      { table: "vark_results", col: "learner_id" },
      { table: "forum_posts", col: "author_id" },
      { table: "direct_messages", col: "sender_id" },
      { table: "direct_messages", col: "recipient_id" },
      { table: "notifications", col: "user_id" },
      { table: "scheduled_announcements", col: "sender_id" },
      { table: "user_roles", col: "user_id" },
      { table: "profiles", col: "id" },
    ];

    for (const t of userScopedTables) {
      const { error } = await (supabaseAdmin.from(t.table as any) as any)
        .delete()
        .eq(t.col, userId);
      if (error && !/does not exist/i.test(error.message)) {
        console.error(`Cleanup failed for ${t.table}.${t.col}:`, error.message);
      }
    }

    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) throw new Error(`Account deletion failed: ${authErr.message}`);

    return { ok: true };
  });
