#!/usr/bin/env node
// Execute SQL directly in Supabase database
// Usage: node scripts/execute-sql.js "SELECT * FROM user_profiles LIMIT 5"
// Or: node scripts/execute-sql.js -f migrations/some-migration.sql

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: './env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Need: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(sql) {
  console.log('🔧 Executing SQL in Supabase...\n');
  console.log('SQL:', sql.substring(0, 200) + (sql.length > 200 ? '...' : ''));
  console.log('');

  try {
    // Use RPC to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If RPC doesn't exist, show helpful message
      if (error.message.includes('exec_sql')) {
        console.error('❌ The exec_sql RPC function is not available.');
        console.error('\n📋 To enable SQL execution, run this in Supabase SQL Editor:\n');
        console.log(`
-- Create helper function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE sql_query;
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;
        `);
        console.log('\n⚠️  After creating this function, you can execute SQL directly from the AI.\n');
      } else {
        throw error;
      }
    } else {
      console.log('✅ SQL executed successfully!');
      if (data) {
        console.log('Result:', JSON.stringify(data, null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Error executing SQL:', err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage:');
  console.error('  node scripts/execute-sql.js "SELECT * FROM user_profiles"');
  console.error('  node scripts/execute-sql.js -f migrations/some-file.sql');
  process.exit(1);
}

let sql;

if (args[0] === '-f' && args[1]) {
  // Read from file
  const filePath = args[1];
  console.log(`📄 Reading SQL from: ${filePath}\n`);
  sql = readFileSync(filePath, 'utf8');
} else {
  // Direct SQL string
  sql = args.join(' ');
}

executeSql(sql);
