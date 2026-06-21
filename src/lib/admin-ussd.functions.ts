// Admin USSD management server functions.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHash } from "crypto";

function hashPin(pin: string): string {
  const pepper = process.env.USSD_PIN_PEPPER || "edo-dlah-ussd";
  return createHash("sha256").update(`${pepper}:${pin}`).digest("hex");
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const adminListUssdLearners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, ussd_enabled, ussd_pin_hash, class_level")
      .not("phone", "is", null)
      .order("full_name");
    if (error) throw error;
    return (data || []).map((r: any) => ({
      ...r,
      has_pin: !!r.ussd_pin_hash,
      ussd_pin_hash: undefined,
    }));
  });

export const adminSetUssdAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; phone?: string; enabled?: boolean; pin?: string | null }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, any> = {};
    if (data.phone !== undefined) {
      const trimmed = (data.phone || "").trim();
      patch.phone = trimmed || null;
    }
    if (data.enabled !== undefined) patch.ussd_enabled = !!data.enabled;
    if (data.pin !== undefined) {
      if (data.pin === null || data.pin === "") {
        patch.ussd_pin_hash = null;
      } else {
        if (!/^\d{4}$/.test(data.pin)) throw new Error("PIN must be 4 digits");
        patch.ussd_pin_hash = hashPin(data.pin);
      }
    }
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await (supabaseAdmin.from("profiles") as any)
      .update(patch)
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const adminListSmsLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("sms_log")
      .select("id, phone, body, purpose, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  });
