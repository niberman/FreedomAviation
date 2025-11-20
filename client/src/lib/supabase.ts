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

// Determine the current domain for cookie configuration
const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname === 'www.freedomaviationco.com' || 
   window.location.hostname === 'freedomaviationco.com');

const cookieDomain = isProduction ? '.freedomaviationco.com' : undefined;

// Create Supabase client with proper browser configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session from URL (for OAuth callbacks, password resets, etc.)
    detectSessionInUrl: true,
    // Use browser's localStorage
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Storage key for session (use different key per domain to avoid conflicts)
    storageKey: isProduction ? 'fa-prod-auth-token' : 'fa-dev-auth-token',
    // Configure cookies for proper cross-subdomain auth
    flowType: 'pkce', // Use PKCE flow for better security
    // Cookie options for custom domain
    ...(cookieDomain && {
      cookieOptions: {
        domain: cookieDomain,
        path: '/',
        sameSite: 'lax',
      },
    }),
  },
});
