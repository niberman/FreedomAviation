import { execSync } from 'child_process';
import { join } from 'path';

const projectRoot = join(process.cwd());
const migrationFile = 'supabase/migrations/20251121190000_align_schema.sql';

console.log('🚀 Applying alignment migration to preview branch...');

try {
  const cmd = `PGPASSWORD="pBpnnuwOggHCVXKWtNdgFljjzMCdfSni" psql -h aws-1-us-west-1.pooler.supabase.com -p 6543 -U postgres.frarfaidvppulsemvogd -d postgres -f ${migrationFile}`;
  
  const output = execSync(cmd, { encoding: 'utf-8', cwd: projectRoot });
  console.log(output);
  console.log('✅ Migration applied successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  if (error.stdout) console.log('Output:', error.stdout.toString());
  if (error.stderr) console.error('Error Output:', error.stderr.toString());
  process.exit(1);
}

