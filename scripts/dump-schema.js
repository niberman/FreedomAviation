import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', 'env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim();
  }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase credentials in env.local');
  process.exit(1);
}

// Function to make REST API call to Supabase
function supabaseQuery(table, select = '*') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    url.searchParams.append('select', select);
    
    const options = {
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Function to execute raw SQL via PostgREST
function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
    
    const body = JSON.stringify({ query: sql });
    
    const options = {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(null);
        }
      });
    });
    
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Reading current Supabase database schema...\n');
  console.log('Since direct database access is limited, I\'ll provide instructions instead.\n');
  
  const projectId = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  INSTRUCTIONS TO PULL SCHEMA FROM SUPABASE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Option 1: Use Supabase SQL Editor (EASIEST)');
  console.log('─────────────────────────────────────────────\n');
  console.log('1. Open your Supabase dashboard:');
  console.log(`   https://app.supabase.com/project/${projectId}/sql/new\n`);
  console.log('2. Paste the following SQL query:\n');
  
  const schemaQuery = `
-- Get complete table definitions
SELECT 
  'CREATE TABLE public.' || table_name || ' (' ||
  string_agg('\\n  ' || column_name || ' ' || udt_name || 
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END, 
  ',') || 
  '\\n);' as table_definition
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;`;
  
  console.log(schemaQuery);
  console.log('\n3. Run the query and copy the results');
  console.log('4. Paste the results into supabase-schema.sql\n');
  
  console.log('Option 2: Use pg_dump command');
  console.log('──────────────────────────────────\n');
  console.log('1. Get your database password from:');
  console.log(`   https://app.supabase.com/project/${projectId}/settings/database\n`);
  console.log('2. Run this command (replace YOUR_PASSWORD):\n');
  console.log(`   pg_dump "postgresql://postgres:YOUR_PASSWORD@db.${projectId}.supabase.co:5432/postgres" \\`);
  console.log(`     --schema=public --schema-only --no-owner --no-acl \\`);
  console.log(`     > supabase-schema-dump.sql\n`);
  
  console.log('Option 3: Use Supabase CLI');
  console.log('──────────────────────────────\n');
  console.log('1. Install Supabase CLI:');
  console.log('   npm install -g supabase\n');
  console.log('2. Login and link project:');
  console.log('   supabase login');
  console.log(`   supabase link --project-ref ${projectId}\n`);
  console.log('3. Pull the schema:');
  console.log('   supabase db pull\n');
  
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Try to at least list the tables we can see
  console.log('Attempting to list available tables via REST API...\n');
  
  try {
    // Try to get table list from the API
    const tables = [
      'user_profiles',
      'aircraft',
      'memberships',
      'maintenance',
      'consumable_events',
      'service_requests',
      'service_tasks',
      'instructors',
      'pricing_packages',
      'invoices',
      'invoice_lines'
    ];
    
    console.log('Tables in your database:');
    for (const table of tables) {
      try {
        const data = await supabaseQuery(table, 'count');
        if (!data.message) {
          console.log(`  ✓ ${table}`);
        }
      } catch (e) {
        // Table might not exist or we don't have permission
      }
    }
    
    console.log('\n✓ These tables exist in your database');
    console.log('\nTo get the complete schema, please use one of the options above.\n');
    
  } catch (error) {
    console.error('Error querying tables:', error.message);
  }
}

main().catch(console.error);

