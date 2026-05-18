import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const deleteUserAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      userId: z.string().uuid(),
      confirmEmail: z.string().min(1).max(320),
      reason: z.string().max(500).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId: actorId } = context;

    // Verify caller is an admin (RLS-scoped check via user_roles)
    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", actorId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) throw new Error("Not authorized");

    if (data.userId === actorId) {
      throw new Error("You cannot delete your own account");
    }

    // Look up the target profile to confirm email matches
    const { data: target, error: targetErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", data.userId)
      .maybeSingle();
    if (targetErr) throw new Error(targetErr.message);
    if (!target) throw new Error("User not found");

    if ((target.email ?? "").trim().toLowerCase() !== data.confirmEmail.trim().toLowerCase()) {
      throw new Error("Confirmation email does not match the user's email");
    }

    // Clean up app-side rows that reference this user (no FK cascade exists)
    const userScopedTables: { table: string; col: string }[] = [
      { table: "attempt_answers", col: "" }, // skip; handled via quiz_attempts cascade-less, leave
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
      if (!t.col) continue;
      const { error } = await (supabaseAdmin.from(t.table as any) as any).delete().eq(t.col, data.userId);
      if (error && !/does not exist/i.test(error.message)) {
        console.error(`Cleanup failed for ${t.table}.${t.col}:`, error.message);
      }
    }

    // Finally delete the auth user
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (authErr) throw new Error(`Auth deletion failed: ${authErr.message}`);

    // Audit log (admin-scoped RPC)
    await supabase.rpc("admin_log_action", {
      p_action: "delete_user",
      p_target_user_id: data.userId,
      p_target_email: target.email ?? "",
      p_details: {
        reason: data.reason ?? null,
        target_name: target.full_name ?? null,
      },
    });

    return { ok: true, deletedUserId: data.userId };
  });
