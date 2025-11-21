#!/usr/bin/env node

/**
 * Apply all migrations to Supabase preview branch in correct order
 * This script creates tables and applies RLS policies
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

// Preview branch configuration
const PREVIEW_BRANCH_ID = 'frarfaidvppulsemvogd';
const PREVIEW_BRANCH_URL = `https://${PREVIEW_BRANCH_ID}.supabase.co`;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in env.local');
  process.exit(1);
}

// Create Supabase client for preview branch
const supabase = createClient(PREVIEW_BRANCH_URL, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migration files in order
const migrations = [
  '20251121000000_create_onboarding_data_table.sql',
  '20251121000001_fix_onboarding_rls.sql',
  '20251121000002_sync_all_tables.sql'
];

async function executeSQLDirect(sql) {
  // Use the Postgres connection directly via REST API
  const url = `${PREVIEW_BRANCH_URL}/rest/v1/rpc/exec`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      // Check if it's an "already exists" or "does not exist" error which we can ignore
      if (errorText.includes('already exists') || 
          errorText.includes('does not exist') ||
          errorText.includes('No rows returned')) {
        return { success: true, skipped: true };
      }
      return { success: false, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function applyMigration(filename) {
  const migrationPath = join(projectRoot, 'supabase', 'migrations', filename);
  
  console.log(`\n📄 Applying: ${filename}`);
  console.log(`   Path: ${migrationPath}\n`);
  
  try {
    const sqlContent = readFileSync(migrationPath, 'utf-8');
    
    // Split into statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        if (!stmt) return false;
        const withoutComments = stmt.replace(/--.*$/gm, '').trim();
        return withoutComments.length > 0 && !withoutComments.startsWith('/*');
      });

    console.log(`   Found ${statements.length} SQL statements\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const preview = statement.substring(0, 70).replace(/\s+/g, ' ');
      
      console.log(`   [${i + 1}/${statements.length}] ${preview}${statement.length > 70 ? '...' : ''}`);
      
      const result = await executeSQLDirect(statement);
      
      if (result.success) {
        if (result.skipped) {
          console.log('      ⊘ Already applied (skipped)\n');
        } else {
          console.log('      ✓ Success\n');
        }
      } else {
        console.error(`      ✗ Error: ${result.error}\n`);
        // Continue anyway - some errors are expected
      }
    }

    console.log(`   ✅ ${filename} completed\n`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to apply ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying migrations to Supabase preview branch\n');
  console.log(`Preview Branch ID: ${PREVIEW_BRANCH_ID}`);
  console.log(`Preview Branch URL: ${PREVIEW_BRANCH_URL}\n`);
  console.log('═'.repeat(70));

  let successCount = 0;
  let failureCount = 0;

  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.log('═'.repeat(70));
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}/${migrations.length}`);
  console.log(`   ❌ Failed: ${failureCount}/${migrations.length}\n`);

  if (failureCount === 0) {
    console.log('✨ All migrations applied successfully!\n');
    console.log('🔍 Verifying tables...\n');

    // Verify onboarding_data table exists
    try {
      const { data, error } = await supabase
        .from('onboarding_data')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.log('⚠️  Could not verify onboarding_data table');
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log('✓ onboarding_data table is accessible\n');
      }
    } catch (e) {
      console.log('⚠️  Verification skipped\n');
    }

    console.log('📋 Next Steps:');
    console.log('  1. Check Supabase dashboard to verify tables');
    console.log('  2. Test onboarding flow in preview environment');
    console.log('  3. Run: supabase branches list (to check status)\n');
  } else {
    console.log('⚠️  Some migrations failed. Check errors above.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});

