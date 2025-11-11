import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client (for server-side operations)
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ CRITICAL: Supabase credentials not set for server operations!");
  console.error("   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

// Service role client for admin operations (bypasses RLS)
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

if (!supabase) {
  throw new Error("Failed to initialize Supabase client");
}

