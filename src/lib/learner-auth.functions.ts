import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  nin: z.string().trim().regex(/^[0-9]{11}$/, "NIN must be 11 digits"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Enter a valid phone number"),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
});

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

/**
 * Looks up a LEARNER's auth email by NIN + parent_phone (+ optional email check).
 * Returns the email so the client can call signInWithPassword with the user's password.
 * Uses supabaseAdmin (RLS bypass) because the requester is not authenticated yet.
 */
export const lookupLearnerEmail = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const ninDigits = data.nin;
    const phoneDigits = normalizePhone(data.phone);
    const emailLc = (data.email ?? "").trim().toLowerCase();

    // Find candidate profiles by NIN (exact 11 digits).
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id,email,parent_phone,nin")
      .eq("nin", ninDigits)
      .limit(20);

    if (error) throw new Error(error.message);
    if (!profiles || profiles.length === 0) {
      throw new Error("No learner found with these details. Check your NIN and phone number.");
    }

    // Match by normalized phone (compare digits only so spaces/dashes/+ don't matter).
    const matched = profiles.filter(
      (p) => normalizePhone(p.parent_phone ?? "") === phoneDigits,
    );
    if (matched.length === 0) {
      throw new Error("No learner found with these details. Check your NIN and phone number.");
    }

    // If email provided, it must also match.
    const finalMatch = emailLc
      ? matched.filter((p) => (p.email ?? "").trim().toLowerCase() === emailLc)
      : matched;
    if (finalMatch.length === 0) {
      throw new Error("Email does not match the account for this NIN and phone.");
    }
    if (finalMatch.length > 1) {
      throw new Error("Multiple accounts match. Please also enter your email to continue.");
    }

    const profile = finalMatch[0];

    // Verify this user actually has the learner role.
    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id);
    if (rolesErr) throw new Error(rolesErr.message);
    const isLearner = (roles ?? []).some((r) => r.role === "learner");
    if (!isLearner) {
      throw new Error("This sign-in method is for learners only.");
    }

    if (!profile.email) {
      throw new Error("No email is linked to this learner account. Contact your school admin.");
    }

    return { email: profile.email };
  });
