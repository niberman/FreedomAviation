import { z } from 'zod';

// ── Client-side env (available in browser via NEXT_PUBLIC_ prefix) ──────────

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

/**
 * Validated client-side environment variables.
 * These are embedded at build time and available in the browser.
 */
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

// ── Server-side env (only available in API routes / server components) ──────

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_SERVICE: z.enum(['resend', 'console']).default('console'),
  EMAIL_FROM: z.string().default('Freedom Aviation <onboarding@resend.dev>'),
  SITE_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validated server-side environment variables.
 * Only parsed on the server (returns null in browser context).
 * All vars are optional to support graceful degradation.
 */
export const serverEnv: ServerEnv | null =
  typeof window === 'undefined' ? serverEnvSchema.parse(process.env) : null;
