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

// Use service role key (ensure it's correct in env.local or provide it here)
// We need PREVIEW branch service key.
// Based on previous steps, we know it:
const PREVIEW_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYXJmYWlkdnBwdWxzZW12b2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE1MDI4OCwiZXhwIjoyMDc4NzI2Mjg4fQ.q12wr6KIGQJhI6HUaX1zzC7X6UilnOb4EhiFc6vuroc";

async function executeSQLDirect(sql) {
  const url = `${PREVIEW_BRANCH_URL}/rest/v1/rpc/exec`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': PREVIEW_SERVICE_KEY,
        'Authorization': `Bearer ${PREVIEW_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function applyMigration() {
  const migrationPath = join(projectRoot, 'supabase', 'migrations', '20251121190000_align_schema.sql');
  console.log(`📄 Applying: ${migrationPath}`);
  
  const sqlContent = readFileSync(migrationPath, 'utf-8');
  
  // Split into statements simply by semicolon is dangerous for DO blocks
  // But the REST API exec function might handle the whole block if it's valid SQL.
  // The problem is 'exec' usually expects a single statement or uses specific parsing.
  // The safest way for PL/pgSQL blocks (DO $$ ... $$) is to send them as one command.
  
  // Our migration uses BEGIN; ... COMMIT;
  // Let's try sending the WHOLE content as one query.
  
  const result = await executeSQLDirect(sqlContent);
  
  if (result.success) {
    console.log('✅ Migration applied successfully!');
  } else {
    console.error('❌ Migration failed:', result.error);
    
    // If it failed, maybe split by DO block?
    // But DO blocks are robust.
  }
}

applyMigration();

