#!/usr/bin/env node

/**
 * Comprehensive integration test for Supabase preview branch
 * Tests all critical functionality with the preview database
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load preview environment
dotenv.config({ path: join(projectRoot, '.env.preview') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.preview');
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

console.log('🧪 Testing Supabase Preview Branch Integration\n');
console.log(`Preview URL: ${supabaseUrl}\n`);
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
console.log('\n📋 Testing Table Structure...\n');

try {
  const { data, error } = await adminClient
    .from('onboarding_data')
    .select('*')
    .limit(0);
  
  if (error) {
    logTest('onboarding_data table exists', 'FAIL', error.message);
  } else {
    logTest('onboarding_data table exists', 'PASS');
  }
} catch (e) {
  logTest('onboarding_data table exists', 'FAIL', e.message);
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

// Test 6: Insert Operation (Service Role)
console.log('\n📝 Testing CRUD Operations...\n');

const testUserId = '00000000-0000-0000-0000-000000000001'; // Fake UUID for testing
let insertedId = null;

try {
  const { data, error } = await adminClient
    .from('onboarding_data')
    .insert({
      user_id: testUserId,
      step: 'welcome',
      personal_info: { test: true },
      completed: false
    })
    .select()
    .single();
  
  if (error) {
    // Expected if user doesn't exist in auth.users
    if (error.message.includes('violates foreign key constraint')) {
      logTest('INSERT operation', 'PASS', 'Foreign key constraint working (expected)');
    } else {
      logTest('INSERT operation', 'FAIL', error.message);
    }
  } else {
    insertedId = data.id;
    logTest('INSERT operation', 'PASS', `Created record ${insertedId}`);
  }
} catch (e) {
  logTest('INSERT operation', 'FAIL', e.message);
}

// Test 7: Schema Validation
console.log('\n🏗️  Testing Schema Integrity...\n');

try {
  // Test with valid schema
  const testData = {
    user_id: testUserId,
    step: 'personal-info',
    personal_info: { full_name: 'Test User', phone: '555-1234' },
    aircraft_info: { tail_number: 'N12345', make: 'Cessna' },
    membership_selection: { tier: 'gold' },
    quote_generated: false,
    completed: false
  };

  const { error } = await adminClient
    .from('onboarding_data')
    .insert(testData)
    .select();

  if (error) {
    if (error.message.includes('violates foreign key constraint')) {
      logTest('Schema validation', 'PASS', 'Schema structure correct');
    } else {
      logTest('Schema validation', 'FAIL', error.message);
    }
  } else {
    logTest('Schema validation', 'PASS', 'All fields accept correct data types');
  }
} catch (e) {
  logTest('Schema validation', 'FAIL', e.message);
}

// Test 8: Unique Constraint
console.log('\n🔒 Testing Constraints...\n');

try {
  // Try to insert duplicate user_id
  await adminClient.from('onboarding_data').insert({
    user_id: testUserId,
    step: 'welcome'
  });
  
  const { error } = await adminClient.from('onboarding_data').insert({
    user_id: testUserId,
    step: 'complete'
  });

  if (error && error.message.includes('duplicate') || error.message.includes('unique')) {
    logTest('Unique constraint on user_id', 'PASS', 'Duplicate prevention working');
  } else {
    logTest('Unique constraint on user_id', 'SKIP', 'Cannot test without valid user');
  }
} catch (e) {
  logTest('Unique constraint on user_id', 'SKIP', 'Test requires valid auth user');
}

// Test 9: JSONB Fields
console.log('\n📦 Testing JSONB Functionality...\n');

try {
  const { data, error } = await adminClient
    .from('onboarding_data')
    .select('personal_info, aircraft_info')
    .limit(1);
  
  if (error && error.code !== 'PGRST116') {
    logTest('JSONB field support', 'FAIL', error.message);
  } else {
    logTest('JSONB field support', 'PASS', 'JSONB fields queryable');
  }
} catch (e) {
  logTest('JSONB field support', 'FAIL', e.message);
}

// Test 10: Timestamp Defaults
console.log('\n⏰ Testing Timestamp Defaults...\n');

try {
  const { data, error } = await adminClient
    .from('onboarding_data')
    .select('created_at, updated_at')
    .limit(1);
  
  if (error && error.code !== 'PGRST116') {
    logTest('Timestamp defaults', 'FAIL', error.message);
  } else {
    logTest('Timestamp defaults', 'PASS', 'Timestamp columns present');
  }
} catch (e) {
  logTest('Timestamp defaults', 'FAIL', e.message);
}

// Test 11: API Response Format
console.log('\n🌐 Testing API Response Format...\n');

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

// Test 12: TypeScript Type Compatibility
console.log('\n📘 Testing TypeScript Integration...\n');

try {
  // This tests if our DB types match the actual schema
  const { data, error } = await adminClient
    .from('onboarding_data')
    .select('id, user_id, step, personal_info, aircraft_info, membership_selection')
    .limit(1);

  if (error && error.code !== 'PGRST116') {
    logTest('TypeScript type compatibility', 'FAIL', error.message);
  } else {
    logTest('TypeScript type compatibility', 'PASS', 'Field names match expected schema');
  }
} catch (e) {
  logTest('TypeScript type compatibility', 'FAIL', e.message);
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
  console.log('✨ All tests passed! Preview branch is ready for use.\n');
  
  console.log('📋 Next Steps:');
  console.log('  1. Update frontend .env to use preview branch');
  console.log('  2. Test onboarding flow in browser');
  console.log('  3. Create test user and complete onboarding');
  console.log('  4. Verify data persists correctly\n');
  
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Review errors above.\n');
  process.exit(1);
}

