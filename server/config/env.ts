/**
 * Centralized Environment Configuration
 * 
 * This module handles all environment variable loading and validation.
 * It resolves the VITE_ vs server-side variable distinction once,
 * and provides typed access to all configuration values.
 * 
 * Usage:
 *   import { config } from './config/env.js';
 *   const url = config.supabase.url;
 */

import { z } from 'zod';

// =============================================================================
// Environment Variable Resolution Helpers
// =============================================================================

/**
 * Get a server-side environment variable, falling back through common prefixes.
 * Priority: SERVER_VAR > NEXT_PUBLIC_VAR > VITE_VAR
 * 
 * Note: VITE_ prefixed variables are NOT available in Vercel serverless runtime.
 * They are only available during the build process.
 */
function getEnvVar(key: string, viteKey?: string, nextKey?: string): string | undefined {
  return (
    process.env[key] ||
    process.env[nextKey || `NEXT_PUBLIC_${key}`] ||
    process.env[viteKey || `VITE_${key}`]
  );
}

// =============================================================================
// Zod Schemas for Validation
// =============================================================================

const SupabaseConfigSchema = z.object({
  url: z.string().url('SUPABASE_URL must be a valid URL'),
  serviceRoleKey: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  anonKey: z.string().optional(),
});

const StripeConfigSchema = z.object({
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  publishableKey: z.string().optional(),
});

const EmailConfigSchema = z.object({
  service: z.enum(['console', 'smtp', 'resend']).default('console'),
  resendApiKey: z.string().optional(),
  from: z.string().default('Freedom Aviation <onboarding@resend.dev>'),
});

const GoogleCalendarConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().optional(),
});

const AppConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(5000),
  frontendUrl: z.string().url().default('http://localhost:5000'),
  siteUrl: z.string().url().optional(),
  apiKeyEmailNotifications: z.string().optional(),
});

// =============================================================================
// Configuration Loading
// =============================================================================

interface Config {
  app: z.infer<typeof AppConfigSchema>;
  supabase: z.infer<typeof SupabaseConfigSchema>;
  stripe: z.infer<typeof StripeConfigSchema>;
  email: z.infer<typeof EmailConfigSchema>;
  googleCalendar: z.infer<typeof GoogleCalendarConfigSchema>;
  isConfigured: {
    supabase: boolean;
    stripe: boolean;
    email: boolean;
    googleCalendar: boolean;
  };
}

function loadConfig(): Config {
  // Load raw values with fallbacks
  const rawSupabase = {
    url: getEnvVar('SUPABASE_URL'),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: getEnvVar('SUPABASE_ANON_KEY'),
  };

  const rawStripe = {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY'),
  };

  const rawEmail = {
    service: process.env.EMAIL_SERVICE || 'console',
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
  };

  const rawGoogleCalendar = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  };

  const rawApp = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    frontendUrl: process.env.FRONTEND_URL || process.env.SITE_URL || 'http://localhost:5000',
    siteUrl: process.env.SITE_URL,
    apiKeyEmailNotifications: process.env.EMAIL_NOTIFICATIONS_API_KEY,
  };

  // Determine what's configured
  const isSupabaseConfigured = !!(rawSupabase.url && rawSupabase.serviceRoleKey);
  const isStripeConfigured = !!rawStripe.secretKey;
  const isEmailConfigured = rawEmail.service === 'resend' ? !!rawEmail.resendApiKey : true;
  const isGoogleCalendarConfigured = !!(rawGoogleCalendar.clientId && rawGoogleCalendar.clientSecret);

  // Validate and parse configurations
  // For optional services, we allow partial configs but track what's available
  let supabaseConfig: z.infer<typeof SupabaseConfigSchema>;
  
  if (isSupabaseConfigured) {
    const result = SupabaseConfigSchema.safeParse(rawSupabase);
    if (!result.success) {
      console.error('❌ Invalid Supabase configuration:');
      result.error.issues.forEach(issue => {
        console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
      });
      throw new Error('Invalid Supabase configuration. Cannot start server.');
    }
    supabaseConfig = result.data;
  } else {
    // Development mode: allow missing Supabase config
    console.warn('⚠️  Supabase not fully configured. Some features will be disabled.');
    console.warn('   To enable: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    supabaseConfig = {
      url: rawSupabase.url || 'not-configured',
      serviceRoleKey: rawSupabase.serviceRoleKey || 'not-configured',
      anonKey: rawSupabase.anonKey,
    };
  }

  const stripeConfig = StripeConfigSchema.parse(rawStripe);
  const emailConfig = EmailConfigSchema.parse(rawEmail);
  const googleCalendarConfig = GoogleCalendarConfigSchema.parse(rawGoogleCalendar);
  const appConfig = AppConfigSchema.parse(rawApp);

  // Log configuration status
  logConfigStatus({
    supabase: isSupabaseConfigured,
    stripe: isStripeConfigured,
    email: isEmailConfigured,
    googleCalendar: isGoogleCalendarConfigured,
  });

  return {
    app: appConfig,
    supabase: supabaseConfig,
    stripe: stripeConfig,
    email: emailConfig,
    googleCalendar: googleCalendarConfig,
    isConfigured: {
      supabase: isSupabaseConfigured,
      stripe: isStripeConfigured,
      email: isEmailConfigured,
      googleCalendar: isGoogleCalendarConfigured,
    },
  };
}

function logConfigStatus(status: Record<string, boolean>) {
  console.log('');
  console.log('📋 Configuration Status:');
  console.log('   ├─ Supabase:', status.supabase ? '✅ Configured' : '⚠️  Not configured');
  console.log('   ├─ Stripe:', status.stripe ? '✅ Configured' : '⚠️  Not configured');
  console.log('   ├─ Email:', status.email ? '✅ Configured' : '⚠️  Console mode');
  console.log('   └─ Google Calendar:', status.googleCalendar ? '✅ Configured' : '⚠️  Not configured');
  console.log('');
}

// =============================================================================
// Singleton Export
// =============================================================================

// Load configuration once at startup
export const config = loadConfig();

// Export individual configs for convenience
export const { app: appConfig } = config;
export const { supabase: supabaseConfig } = config;
export const { stripe: stripeConfig } = config;
export const { email: emailConfig } = config;
export const { googleCalendar: googleCalendarConfig } = config;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a feature is available based on configuration
 */
export function isFeatureEnabled(feature: keyof Config['isConfigured']): boolean {
  return config.isConfigured[feature];
}

/**
 * Require a feature to be configured, throwing if not
 */
export function requireFeature(feature: keyof Config['isConfigured'], featureName: string): void {
  if (!config.isConfigured[feature]) {
    throw new Error(`${featureName} is not configured. Please set the required environment variables.`);
  }
}

/**
 * Get allowed CORS origins based on environment
 */
export function getAllowedOrigins(): string[] {
  const origins = [
    'https://freedomaviationco.com',
    'https://www.freedomaviationco.com',
  ];
  
  if (config.app.nodeEnv === 'development') {
    origins.push(
      'http://localhost:5000',
      'http://localhost:5173',
      'http://localhost:5002',
    );
  }
  
  return origins;
}

export default config;

