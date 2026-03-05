import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole, type AuthResult } from '@/lib/api-auth';
import type { UserRole } from '@shared/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Context passed to route handlers wrapped with `withAuth`.
 */
export interface HandlerContext {
  /** The original Next.js request */
  request: NextRequest;
  /** Authenticated user and profile */
  auth: AuthResult;
  /** Supabase admin client (bypasses RLS) */
  supabase: SupabaseClient;
  /** Resolved dynamic route params (e.g. `{ id: '...' }`) */
  params?: Record<string, string>;
}

type RouteHandler = (ctx: HandlerContext) => Promise<NextResponse>;

interface WithAuthOptions {
  roles: readonly UserRole[];
}

/**
 * Wrap a Next.js API route handler with auth, Supabase client creation, and error handling.
 *
 * Eliminates the repeated boilerplate of:
 * 1. `requireRole()` → 401/403/503 responses
 * 2. `createAdminClient()` → 503 if not configured
 * 3. try/catch → 500 with logged error
 *
 * @example
 * ```ts
 * export const GET = withAuth({ roles: API_ROLES.ALL_STAFF }, async ({ supabase }) => {
 *   const { data, error } = await supabase.from('aircraft').select('*');
 *   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 *   return NextResponse.json({ aircraft: data });
 * });
 * ```
 */
export function withAuth(options: WithAuthOptions, handler: RouteHandler) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    // 1. Auth check
    const result = await requireRole(request, [...options.roles]);
    if (!result.ok) {
      const label =
        result.status === 401
          ? 'Unauthorized'
          : result.status === 503
            ? 'Service Unavailable'
            : 'Forbidden';
      return NextResponse.json(
        { error: label, message: result.message },
        { status: result.status },
      );
    }

    // 2. Supabase admin client
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          message: 'Server is missing required Supabase environment variables.',
        },
        { status: 503 },
      );
    }

    // 3. Resolve dynamic route params if present
    const params = context?.params ? await context.params : undefined;

    // 4. Execute handler with error boundary
    try {
      return await handler({ request, auth: result.auth, supabase, params });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        `Error in ${request.method} ${request.nextUrl.pathname}:`,
        err,
      );
      return NextResponse.json(
        { error: 'Internal server error', message },
        { status: 500 },
      );
    }
  };
}
