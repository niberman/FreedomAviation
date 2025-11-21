#!/usr/bin/env node

/**
 * Fix migration history mismatch between local and remote
 * Handles the case where remote has migrations not in local directory
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔧 Fixing Supabase Migration History for Preview Branch\n');
console.log('═'.repeat(70) + '\n');

// Get remote migrations using Supabase CLI
console.log('📡 Checking remote migrations...\n');

try {
  const output = execSync(
    'PGPASSWORD="pBpnnuwOggHCVXKWtNdgFljjzMCdfSni" psql -h aws-1-us-west-1.pooler.supabase.com -p 6543 -U postgres.frarfaidvppulsemvogd -d postgres -t -c "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;"',
    { encoding: 'utf-8', cwd: projectRoot }
  );

  const remoteMigrations = output
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`Found ${remoteMigrations.length} remote migrations:\n`);
  remoteMigrations.forEach(version => console.log(`  • ${version}`));
  console.log('');

  // Get local migrations
  const localOutput = execSync('ls supabase/migrations/', { encoding: 'utf-8', cwd: projectRoot });
  const localMigrations = localOutput
    .split('\n')
    .filter(f => f.match(/^\d{14}_.*\.sql$/))
    .map(f => f.substring(0, 14));

  console.log(`Found ${localMigrations.length} local migrations:\n`);
  localMigrations.forEach(version => console.log(`  • ${version}`));
  console.log('');

  // Find mismatches
  const remoteMissing = remoteMigrations.filter(v => !localMigrations.includes(v));
  const localMissing = localMigrations.filter(v => !remoteMigrations.includes(v));

  if (remoteMissing.length > 0) {
    console.log('⚠️  Remote migrations not found locally:\n');
    remoteMissing.forEach(version => console.log(`  • ${version}`));
    console.log('\n💡 Solutions:\n');
    console.log('  Option 1: Mark as reverted (recommended for preview)');
    console.log(`    supabase migration repair --status reverted ${remoteMissing.join(' ')}`);
    console.log('\n  Option 2: Pull migrations from remote');
    console.log('    supabase db pull');
    console.log('');
  }

  if (localMissing.length > 0) {
    console.log('📝 Local migrations not yet applied:\n');
    localMissing.forEach(version => console.log(`  • ${version}`));
    console.log('\n💡 Apply with:');
    console.log('    supabase db push --db-url "postgresql://postgres.frarfaidvppulsemvogd:pBpnnuwOggHCVXKWtNdgFljjzMCdfSni@aws-1-us-west-1.pooler.supabase.com:6543/postgres"');
    console.log('');
  }

  if (remoteMissing.length === 0 && localMissing.length === 0) {
    console.log('✅ Local and remote migrations are in sync!\n');
  }

  // Generate repair command
  if (remoteMissing.length > 0) {
    console.log('\n🔧 Auto-Repair Command:\n');
    const repairCmd = `PGPASSWORD="pBpnnuwOggHCVXKWtNdgFljjzMCdfSni" psql -h aws-1-us-west-1.pooler.supabase.com -p 6543 -U postgres.frarfaidvppulsemvogd -d postgres -c "DELETE FROM supabase_migrations.schema_migrations WHERE version IN (${remoteMissing.map(v => `'${v}'`).join(', ')});"`;
    
    console.log('Remove old migrations from remote:\n');
    console.log(repairCmd);
    console.log('\n⚠️  WARNING: This will delete migration history. Only use for preview branch!\n');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n💡 Troubleshooting:');
  console.error('  1. Ensure you have psql installed');
  console.error('  2. Check database credentials');
  console.error('  3. Verify network connectivity\n');
  process.exit(1);
}

