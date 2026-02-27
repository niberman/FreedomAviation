import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createAdminClient, createAnonClient, isSupabaseConfigured } from './supabase-server';
import type { UserRole } from '@shared/database-types';

export interface AuthResult {
  user: User;
  profile: { id: string; role: UserRole } | null;
}

/**
 * Extract and validate the authenticated user from the request (Bearer token).
 * Returns user and profile if token is valid; profile may be null if no row in user_profiles.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthResult | null> {
  if (!isSupabaseConfigured()) return null;

  const supabaseAnon = createAnonClient();
  if (!supabaseAnon) return null;

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
  if (authError || !user) return null;

  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) return null;
  return { user, profile: profile ?? null };
}

/** Result of requireRole: either success with auth, or failure with status code. */
export type RequireRoleResult =
  | { ok: true; auth: AuthResult }
  | { ok: false; status: 401 | 403 | 503; message: string };

/**
 * Require one of the given roles. Returns success with auth or failure with 401/403/503.
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<RequireRoleResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, status: 503, message: 'Server is missing required Supabase environment variables.' };
  }

  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return { ok: false, status: 401, message: 'Missing or invalid authorization token. Please log in.' };
  }
  if (!auth.profile?.role || !allowedRoles.includes(auth.profile.role)) {
    return { ok: false, status: 403, message: "You don't have permission to access this resource." };
  }
  return { ok: true, auth };
}
