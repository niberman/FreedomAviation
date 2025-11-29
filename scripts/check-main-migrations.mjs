import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

dotenv.config({ path: join(projectRoot, 'env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in env.local');
  process.exit(1);
}

console.log(`Checking migrations for: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkMigrations() {
  try {
    // Try to query the migrations table via RPC if possible, or just check table existence
    // Since we can't easily run raw SQL via JS client without a specific RPC, 
    // we'll try to invoke a system function or check a known table state.
    
    // Check if onboarding_data exists and has RLS
    const { data: onboardingPolicies, error: obError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'onboarding_data');

    if (obError) {
        // pg_policies might not be accessible via postgrest without config
        console.log('⚠️ Cannot read pg_policies directly (expected).');
    }

    // Let's check if we can insert/read from onboarding_data as a test
    const { data: obData, error: obReadError } = await supabase
        .from('onboarding_data')
        .select('count')
        .limit(1);
        
    if (obReadError) {
        console.log(`❌ Error accessing onboarding_data: ${obReadError.message}`);
    } else {
        console.log(`✅ onboarding_data table is accessible.`);
    }

    // Check invoices access for staff
    // We can't easily impersonate a staff user here without logging in, 
    // but we can check if the table exists.
    const { error: invError } = await supabase
        .from('invoices')
        .select('id')
        .limit(1);
        
    if (invError) {
        console.log(`❌ Error accessing invoices: ${invError.message}`);
    } else {
        console.log(`✅ invoices table is accessible.`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkMigrations();

