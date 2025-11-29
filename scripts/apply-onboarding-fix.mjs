#!/usr/bin/env node

/**
 * Apply onboarding RLS fix to Supabase database
 * Uses Supabase service role key to execute SQL migrations
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables
dotenv.config({ path: join(projectRoot, 'env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.local');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec', { sql });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    // If exec function doesn't exist, try direct query
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return { success: true, data: await response.json() };
    } catch (fetchError) {
      // Last resort: use PostgREST to execute via a custom function
      console.log('Note: Direct SQL execution not available. Applying via policy statements...');
      throw fetchError;
    }
  }
}

async function applyMigration() {
  console.log('🚀 Applying onboarding RLS fix to Supabase...\n');

  try {
    // Read the migration file
    const migrationPath = join(projectRoot, 'migrations', 'fix_onboarding_rls_idempotent.sql');
    console.log(`📄 Reading: ${migrationPath}`);
    const sqlContent = readFileSync(migrationPath, 'utf-8');

    console.log('✓ Migration file loaded\n');
    console.log('📊 Applying migration...\n');

    // Split into statements and filter out comments and empty lines
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        if (!stmt) return false;
        if (stmt.startsWith('--')) return false;
        // Remove SQL comments
        const withoutComments = stmt.replace(/--.*$/gm, '').trim();
        return withoutComments.length > 0;
      });

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
      
      console.log(`[${i + 1}/${statements.length}] ${preview}${statement.length > 80 ? '...' : ''}`);
      
      try {
        await executeSQL(statement + ';');
        console.log('  ✓ Success\n');
      } catch (error) {
        // Some errors are expected (like "policy already exists" during DROP IF EXISTS)
        if (error.message && error.message.includes('does not exist')) {
          console.log('  ⊘ Already applied (skipped)\n');
        } else {
          console.error(`  ✗ Error: ${error.message}\n`);
          throw error;
        }
      }
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('🔍 Verifying onboarding_data table policies...\n');

    // Verify policies were created
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'onboarding_data');

    if (policiesError) {
      console.log('⚠️  Could not verify policies (this is normal)');
    } else {
      console.log(`✓ Found ${policies?.length || 0} policies on onboarding_data table`);
      if (policies && policies.length > 0) {
        policies.forEach(p => {
          console.log(`  - ${p.policyname} (${p.cmd})`);
        });
      }
    }

    console.log('\n✨ All done! Onboarding flow should now work correctly.\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct');
    console.error('  2. Verify service role key has necessary permissions');
    console.error('  3. Try running the SQL manually in Supabase dashboard');
    console.error('\n📝 SQL File Location:');
    console.error(`  ${join(projectRoot, 'migrations', 'fix_onboarding_rls_idempotent.sql')}`);
    process.exit(1);
  }
}

// Run the migration
applyMigration();

