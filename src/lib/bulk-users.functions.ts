import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RowSchema = z.object({
  email: z.string().trim().email().max(320),
  full_name: z.string().trim().min(1).max(150),
  role: z.enum(["learner", "teacher"]),
  class_level: z.string().trim().max(50).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  lga: z.string().trim().max(100).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  password: z.string().min(6).max(72).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

const InputSchema = z.object({
  rows: z.array(RowSchema).min(1).max(500),
});

function randomPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

export const bulkCreateUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId: actorId } = context;

    const { data: adminRow, error: roleErr } = await supabase
      .from("user_roles").select("role").eq("user_id", actorId).eq("role", "admin").maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!adminRow) throw new Error("Not authorized");

    const results: Array<{
      row: number; email: string; full_name: string; role: string;
      ok: boolean; password?: string; error?: string;
    }> = [];

    for (let i = 0; i < data.rows.length; i++) {
      const r = data.rows[i];
      const password = r.password ?? randomPassword();
      try {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: r.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: r.full_name },
        });
        if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create");

        const uid = created.user.id;
        // handle_new_user trigger has created the profile + learner role.
        const profilePatch: Record<string, any> = { full_name: r.full_name };
        if (r.class_level) profilePatch.class_level = r.class_level;
        if (r.lga) profilePatch.lga = r.lga;
        profilePatch.status = "active";
        await supabaseAdmin.from("profiles").update(profilePatch).eq("id", uid);

        if (r.role === "teacher") {
          await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "teacher" } as any);
        }

        results.push({ row: i + 1, email: r.email, full_name: r.full_name, role: r.role, ok: true, password });
      } catch (e: any) {
        results.push({ row: i + 1, email: r.email, full_name: r.full_name, role: r.role, ok: false, error: e?.message ?? "Unknown error" });
      }
    }

    const created = results.filter((x) => x.ok).length;
    const failed = results.length - created;

    await supabase.rpc("admin_log_action", {
      p_action: "bulk_create_users",
      p_target_user_id: actorId,
      p_target_email: "",
      p_details: { created, failed, total: results.length },
    });

    return { results, created, failed, total: results.length };
  });
