import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';
import { clientEnv } from '@/lib/env';

const supabaseUrl = serverEnv?.SUPABASE_URL || clientEnv.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = serverEnv?.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = serverEnv?.SUPABASE_ANON_KEY || clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const authOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
} as const;

/** Service role client for server-side operations (bypasses RLS). Use for API routes after validating the user. */
export function createAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, authOptions);
}

/** Anon client for validating Bearer tokens (getUser). Use in API routes to verify auth. */
export function createAnonClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, authOptions);
}

/** Whether Supabase is configured (both clients available). */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey && supabaseAnonKey);
}
