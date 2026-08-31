import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  oracle: z.string().trim().min(1, "Enter your Oracle number").max(50),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
});

/**
 * Looks up a TEACHER's auth email by Oracle number (teacher_id).
 * Email is optional but if provided must match. Returns the email so the
 * client can call signInWithPassword.
 */
export const lookupTeacherEmail = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const oracle = data.oracle.trim();
    const emailLc = (data.email ?? "").trim().toLowerCase();

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id,email,teacher_id,created_at")
      .ilike("teacher_id", oracle)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) throw new Error(error.message);
    if (!profiles || profiles.length === 0) {
      throw new Error("No teacher found with that Oracle number.");
    }

    // Oracle number + password is the identifier. If an email was supplied we
    // narrow with it, otherwise the first matching account is used.
    const narrowed = emailLc
      ? profiles.filter((p) => (p.email ?? "").trim().toLowerCase() === emailLc)
      : profiles;
    if (narrowed.length === 0) {
      throw new Error("Email does not match the account for this Oracle number.");
    }

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id,role")
      .in("user_id", narrowed.map((p) => p.id))
      .eq("role", "teacher");
    if (rolesErr) throw new Error(rolesErr.message);

    const teacherIds = new Set((roles ?? []).map((r) => r.user_id));
    const profile = narrowed.find((p) => teacherIds.has(p.id) && !!p.email);
    if (!profile) {
      if (narrowed.some((p) => teacherIds.has(p.id))) {
        throw new Error("No email is linked to this teacher account. Contact an admin.");
      }
      throw new Error("This sign-in method is for teachers only.");
    }

    return { email: profile.email! };

  });
