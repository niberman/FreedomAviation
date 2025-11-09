import { createClient } from "@supabase/supabase-js";
import { getEnvVar } from "./env";

const supabaseUrl =
  getEnvVar("VITE_SUPABASE_URL") ?? getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey =
  getEnvVar("VITE_SUPABASE_ANON_KEY") ?? getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set VITE_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and VITE_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
