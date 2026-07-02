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
      .select("id,email,teacher_id")
      .ilike("teacher_id", oracle)
      .limit(20);

    if (error) throw new Error(error.message);
    if (!profiles || profiles.length === 0) {
      throw new Error("No teacher found with that Oracle number.");
    }

    const finalMatch = emailLc
      ? profiles.filter((p) => (p.email ?? "").trim().toLowerCase() === emailLc)
      : profiles;
    if (finalMatch.length === 0) {
      throw new Error("Email does not match the account for this Oracle number.");
    }
    if (finalMatch.length > 1) {
      throw new Error("Multiple accounts match. Please also enter your email to continue.");
    }

    const profile = finalMatch[0];

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id);
    if (rolesErr) throw new Error(rolesErr.message);
    const isTeacher = (roles ?? []).some((r) => r.role === "teacher");
    if (!isTeacher) {
      throw new Error("This sign-in method is for teachers only.");
    }

    if (!profile.email) {
      throw new Error("No email is linked to this teacher account. Contact an admin.");
    }

    return { email: profile.email };
  });
