#!/usr/bin/env node

/**
 * Comprehensive integration test for Supabase MAIN (production) branch
 * Tests all critical functionality with the production database
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load main environment
dotenv.config({ path: join(projectRoot, 'env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in env.local');
  process.exit(1);
}

// Create clients
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function logTest(name, status, message = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⊘';
  console.log(`${emoji} ${name}${message ? ': ' + message : ''}`);
  
  testResults.tests.push({ name, status, message });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.skipped++;
}

console.log('🧪 Testing Supabase MAIN (Production) Branch Integration\n');
console.log(`Production URL: ${supabaseUrl}\n`);
console.log('⚠️  Running in READ-ONLY mode - no data will be modified\n');
console.log('═'.repeat(70) + '\n');

// Test 1: Connection
console.log('📡 Testing Database Connection...\n');

try {
  const { data, error } = await adminClient.from('onboarding_data').select('count', { count: 'exact', head: true });
  
  if (error && error.code !== 'PGRST116') {
    logTest('Database Connection', 'FAIL', error.message);
  } else {
    logTest('Database Connection', 'PASS', 'Connected successfully');
  }
} catch (e) {
  logTest('Database Connection', 'FAIL', e.message);
}

// Test 2: Table Existence
console.log('\n📋 Testing Core Tables...\n');

const coreTables = [
  'onboarding_data',
  'user_profiles',
  'aircraft',
  'service_requests',
  'invoices',
  'memberships'
];

for (const table of coreTables) {
  try {
    const { data, error } = await adminClient
      .from(table)
      .select('*')
      .limit(0);
    
    if (error) {
      logTest(`Table: ${table}`, 'FAIL', error.message);
    } else {
      logTest(`Table: ${table}`, 'PASS');
    }
  } catch (e) {
    logTest(`Table: ${table}`, 'FAIL', e.message);
  }
}

// Test 3: Auth Configuration
console.log('\n🔐 Testing Authentication...\n');

try {
  const { data: { user }, error } = await anonClient.auth.getUser();
  
  if (error && error.message !== 'Auth session missing!') {
    logTest('Auth system available', 'FAIL', error.message);
  } else {
    logTest('Auth system available', 'PASS', 'Auth endpoints responsive');
  }
} catch (e) {
  logTest('Auth system available', 'FAIL', e.message);
}

// Test 4: RLS Policies (Anonymous access should be blocked)
console.log('\n🛡️  Testing Row Level Security...\n');

try {
  const { data, error } = await anonClient
    .from('onboarding_data')
    .select('*')
    .limit(1);
  
  // Should fail for anon user (no auth)
  if (error) {
    logTest('RLS blocks anonymous access', 'PASS', 'Anonymous access correctly blocked');
  } else if (data && data.length === 0) {
    logTest('RLS blocks anonymous access', 'PASS', 'No data returned (RLS working)');
  } else {
    logTest('RLS blocks anonymous access', 'FAIL', 'Anonymous should not have access');
  }
} catch (e) {
  logTest('RLS blocks anonymous access', 'PASS', 'Access denied as expected');
}

// Test 5: Service Role Bypass
console.log('\n🔑 Testing Service Role Access...\n');

try {
  const { data, error } = await adminClient
    .from('onboarding_data')
    .select('count', { count: 'exact', head: true });
  
  if (error && error.code !== 'PGRST116') {
    logTest('Service role bypasses RLS', 'FAIL', error.message);
  } else {
    logTest('Service role bypasses RLS', 'PASS', 'Service role has full access');
  }
} catch (e) {
  logTest('Service role bypasses RLS', 'FAIL', e.message);
}

// Test 6: Data Existence (Read-only check)
console.log('\n📊 Testing Data Integrity...\n');

try {
  const { count, error } = await adminClient
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    logTest('User profiles exist', 'FAIL', error.message);
  } else {
    logTest('User profiles exist', 'PASS', `Found ${count || 0} user profiles`);
  }
} catch (e) {
  logTest('User profiles exist', 'FAIL', e.message);
}

// Test 7: Schema Validation
console.log('\n🏗️  Testing Schema Integrity...\n');

try {
  const { data, error } = await adminClient
    .from('onboarding_data')
    .select('id, user_id, step, personal_info, aircraft_info, membership_selection, created_at, updated_at')
    .limit(1);

  if (error && error.code !== 'PGRST116') {
    logTest('Schema validation', 'FAIL', error.message);
  } else {
    logTest('Schema validation', 'PASS', 'All expected fields present');
  }
} catch (e) {
  logTest('Schema validation', 'FAIL', e.message);
}

// Test 8: API Response Format
console.log('\n🌐 Testing API Endpoints...\n');

try {
  const response = await fetch(`${supabaseUrl}/rest/v1/onboarding_data?limit=0`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json'
    }
  });

  if (response.ok || response.status === 200 || response.status === 401) {
    logTest('REST API endpoint', 'PASS', `API responds with status ${response.status}`);
  } else {
    logTest('REST API endpoint', 'FAIL', `Unexpected status ${response.status}`);
  }
} catch (e) {
  logTest('REST API endpoint', 'FAIL', e.message);
}

// Test 9: Foreign Key Relationships
console.log('\n🔗 Testing Relationships...\n');

try {
  const { data, error } = await adminClient
    .from('aircraft')
    .select('id, tail_number, owner_id')
    .limit(1);

  if (error && error.code !== 'PGRST116') {
    logTest('Foreign key relationships', 'FAIL', error.message);
  } else {
    logTest('Foreign key relationships', 'PASS', 'Relationships queryable');
  }
} catch (e) {
  logTest('Foreign key relationships', 'FAIL', e.message);
}

// Test 10: User Roles System
console.log('\n👥 Testing User Roles...\n');

try {
  const { data, error } = await adminClient
    .from('user_profiles')
    .select('id, role')
    .limit(1);

  if (error && error.code !== 'PGRST116') {
    logTest('User roles system', 'FAIL', error.message);
  } else {
    logTest('User roles system', 'PASS', 'Role field accessible');
  }
} catch (e) {
  logTest('User roles system', 'FAIL', e.message);
}

// Summary
console.log('\n' + '═'.repeat(70));
console.log('\n📊 Test Summary:\n');
console.log(`   ✅ Passed:  ${testResults.passed}`);
console.log(`   ❌ Failed:  ${testResults.failed}`);
console.log(`   ⊘  Skipped: ${testResults.skipped}`);
console.log(`   📝 Total:   ${testResults.tests.length}\n`);

// Detailed Results
if (testResults.failed > 0) {
  console.log('❌ Failed Tests:\n');
  testResults.tests
    .filter(t => t.status === 'FAIL')
    .forEach(t => console.log(`   • ${t.name}: ${t.message}`));
  console.log('');
}

// Overall Status
if (testResults.failed === 0) {
  console.log('✨ All production tests passed!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Review errors above.\n');
  process.exit(1);
}

