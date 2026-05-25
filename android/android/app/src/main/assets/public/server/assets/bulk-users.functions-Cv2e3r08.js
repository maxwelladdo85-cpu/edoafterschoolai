import { c as createServerRpc } from "./createServerRpc-Cc1mmEGZ.js";
import { l as createServerFn } from "./server-Cxw6WwHr.js";
import { r as requireSupabaseAuth } from "./auth-middleware-BU6DgO9n.js";
import { s as supabaseAdmin } from "./client.server-B_G6e_7N.js";
import { o as objectType, s as stringType, l as literalType, e as enumType, a as arrayType } from "./types-Ch40mmLW.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./index-ChW4vIqc.js";
const RowSchema = objectType({
  email: stringType().trim().email().max(320),
  full_name: stringType().trim().min(1).max(150),
  role: enumType(["learner", "teacher"]),
  class_level: stringType().trim().max(50).optional().or(literalType("")).transform((v) => v ? v : void 0),
  lga: stringType().trim().max(100).optional().or(literalType("")).transform((v) => v ? v : void 0),
  password: stringType().min(6).max(72).optional().or(literalType("")).transform((v) => v ? v : void 0)
});
const InputSchema = objectType({
  rows: arrayType(RowSchema).min(1).max(500)
});
function randomPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}
const bulkCreateUsers_createServerFn_handler = createServerRpc({
  id: "576d0135ae258276f3ecc55e61cc0e30cae4f06f1270eb8d895f0247e84f0a20",
  name: "bulkCreateUsers",
  filename: "src/lib/bulk-users.functions.ts"
}, (opts) => bulkCreateUsers.__executeServer(opts));
const bulkCreateUsers = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => InputSchema.parse(input)).handler(bulkCreateUsers_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId: actorId
  } = context;
  const {
    data: adminRow,
    error: roleErr
  } = await supabase.from("user_roles").select("role").eq("user_id", actorId).eq("role", "admin").maybeSingle();
  if (roleErr) throw new Error(roleErr.message);
  if (!adminRow) throw new Error("Not authorized");
  const results = [];
  for (let i = 0; i < data.rows.length; i++) {
    const r = data.rows[i];
    const password = r.password ?? randomPassword();
    try {
      const {
        data: created2,
        error: createErr
      } = await supabaseAdmin.auth.admin.createUser({
        email: r.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: r.full_name
        }
      });
      if (createErr || !created2.user) throw new Error(createErr?.message ?? "Failed to create");
      const uid = created2.user.id;
      const profilePatch = {
        full_name: r.full_name
      };
      if (r.class_level) profilePatch.class_level = r.class_level;
      if (r.lga) profilePatch.lga = r.lga;
      profilePatch.status = "active";
      await supabaseAdmin.from("profiles").update(profilePatch).eq("id", uid);
      if (r.role === "teacher") {
        await supabaseAdmin.from("user_roles").insert({
          user_id: uid,
          role: "teacher"
        });
      }
      results.push({
        row: i + 1,
        email: r.email,
        full_name: r.full_name,
        role: r.role,
        ok: true,
        password
      });
    } catch (e) {
      results.push({
        row: i + 1,
        email: r.email,
        full_name: r.full_name,
        role: r.role,
        ok: false,
        error: e?.message ?? "Unknown error"
      });
    }
  }
  const created = results.filter((x) => x.ok).length;
  const failed = results.length - created;
  await supabase.rpc("admin_log_action", {
    p_action: "bulk_create_users",
    p_target_user_id: actorId,
    p_target_email: "",
    p_details: {
      created,
      failed,
      total: results.length
    }
  });
  return {
    results,
    created,
    failed,
    total: results.length
  };
});
export {
  bulkCreateUsers_createServerFn_handler
};
