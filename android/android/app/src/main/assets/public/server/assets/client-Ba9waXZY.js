import { c as createClient } from "./index-ChW4vIqc.js";
function createSupabaseClient() {
  const SUPABASE_URL = "https://yiqftntrjkoksuylpxph.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcWZ0bnRyamtva3N1eWxweHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDUxNzMsImV4cCI6MjA5NDI4MTE3M30.BsenJ0DHQXibX28g-CCakKVd0uj04OZAsQqOk4qBMdk";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
export {
  supabase as s
};
