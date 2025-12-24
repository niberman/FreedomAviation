import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Some features may not work.');
}

// Determine the current domain for cookie configuration (if running in browser)
const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname === 'www.freedomaviationco.com' || 
   window.location.hostname === 'freedomaviationco.com');

const cookieDomain = isProduction ? '.freedomaviationco.com' : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
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

// Helper to get the current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
}

// Helper to get current session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
}
