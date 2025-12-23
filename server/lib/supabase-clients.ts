/**
 * Supabase Client Factory
 * 
 * Provides typed Supabase clients for server-side operations.
 * Uses the centralized config for environment variables.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, isFeatureEnabled } from '../config/env.js';

// Singleton instances
let supabaseAdmin: SupabaseClient | null = null;
let supabaseAnon: SupabaseClient | null = null;
let initialized = false;

/**
 * Initialize Supabase clients
 * Called once at server startup
 */
export function initializeSupabaseClients(): void {
  if (initialized) return;
  
  if (!isFeatureEnabled('supabase')) {
    console.warn('⚠️  Supabase clients not initialized: missing configuration');
    initialized = true;
    return;
  }

  // Admin client with service role (bypasses RLS)
  supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Anon client for verifying user tokens (respects RLS)
  if (config.supabase.anonKey) {
    supabaseAnon = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  } else {
    // Use admin client as fallback if no anon key
    supabaseAnon = supabaseAdmin;
    console.warn('⚠️  Using admin client for auth (SUPABASE_ANON_KEY not set)');
  }

  initialized = true;
  console.log('✅ Supabase clients initialized');
}

/**
 * Get Supabase clients
 * Returns null if not configured
 */
export function getSupabaseClients(): {
  supabaseAdmin: SupabaseClient | null;
  supabaseAnon: SupabaseClient | null;
} {
  if (!initialized) {
    initializeSupabaseClients();
  }
  
  return { supabaseAdmin, supabaseAnon };
}

/**
 * Get the admin Supabase client (bypasses RLS)
 * Throws if not configured
 */
export function getAdminClient(): SupabaseClient {
  const { supabaseAdmin } = getSupabaseClients();
  
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }
  
  return supabaseAdmin;
}

/**
 * Get the anon Supabase client (respects RLS)
 * Throws if not configured
 */
export function getAnonClient(): SupabaseClient {
  const { supabaseAnon } = getSupabaseClients();
  
  if (!supabaseAnon) {
    throw new Error('Supabase anon client not configured');
  }
  
  return supabaseAnon;
}

/**
 * Check if Supabase is available
 */
export function isSupabaseAvailable(): boolean {
  const { supabaseAdmin, supabaseAnon } = getSupabaseClients();
  return supabaseAdmin !== null && supabaseAnon !== null;
}

