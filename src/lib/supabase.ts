import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fuuvlbqgzxcqajqkaotl.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key-for-build";

const hasServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-key-for-build";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !hasServiceKey) {
  console.warn(
    "LifeOS: Set SUPABASE_SERVICE_ROLE_KEY in .env.local or API writes will hit RLS errors (42501)."
  );
}

// Service role client bypasses Row Level Security (RLS) policies for secure, single-tenant management
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
