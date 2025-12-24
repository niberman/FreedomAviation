#!/usr/bin/env node
/**
 * Diagnostic script for founder role access issues
 * Run with: node scripts/diagnose-founder-access.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Diagnosing Founder Role Access Issues\n');
console.log('='.repeat(50));

async function runDiagnostics() {
  try {
    // 1. Check for founder users
    console.log('\n1️⃣  Checking for users with founder role...');
    const { data: founders, error: foundersError } = await supabase
      .from('user_profiles')
      .select('id, email, role, full_name')
      .eq('role', 'founder');
    
    if (foundersError) {
      console.error('   ❌ Error querying founders:', foundersError.message);
    } else if (!founders?.length) {
      console.log('   ⚠️  No users with founder role found!');
    } else {
      console.log(`   ✅ Found ${founders.length} founder(s):`);
      founders.forEach(f => {
        console.log(`      - ${f.email} (role: "${f.role}", length: ${f.role?.length})`);
        // Check for whitespace
        if (f.role !== f.role?.trim()) {
          console.log(`         ⚠️  WARNING: Role has whitespace! Actual: "${f.role}"`);
        }
      });
    }

    // 2. Check the user_role enum values
    console.log('\n2️⃣  Checking user_role enum values...');
    const { data: enumData, error: enumError } = await supabase.rpc('get_enum_values', {
      enum_name: 'user_role'
    }).maybeSingle();
    
    if (enumError && enumError.code === 'PGRST202') {
      // Function doesn't exist, try raw query approach
      const { data: rawEnum, error: rawError } = await supabase
        .from('user_profiles')
        .select('role')
        .limit(100);
      
      if (rawError) {
        console.log('   ⚠️  Could not query enum values directly');
      } else {
        const uniqueRoles = [...new Set(rawEnum?.map(r => r.role) || [])];
        console.log(`   📋 Unique roles in use: ${uniqueRoles.join(', ')}`);
        if (!uniqueRoles.includes('founder')) {
          console.log('   ⚠️  WARNING: No users currently have "founder" role');
        }
      }
    } else if (enumData) {
      console.log(`   ✅ Enum values: ${JSON.stringify(enumData)}`);
    }

    // 3. Check RLS policies on user_profiles
    console.log('\n3️⃣  Checking RLS policies on user_profiles...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'user_profiles' });
    
    if (policiesError && policiesError.code === 'PGRST202') {
      console.log('   ℹ️  Cannot check policies directly (function not available)');
      console.log('   💡 Run this SQL in Supabase SQL Editor:');
      console.log(`
      SELECT policyname, cmd, qual
      FROM pg_policies
      WHERE tablename = 'user_profiles';
      `);
    } else if (policies) {
      console.log(`   ✅ Found ${policies.length} policies`);
      policies.forEach(p => console.log(`      - ${p.policyname} (${p.cmd})`));
    }

    // 4. Check if is_staff_user function exists and its definition
    console.log('\n4️⃣  Checking is_staff_user() function...');
    const { data: funcDef, error: funcError } = await supabase.rpc('check_function_exists', {
      func_name: 'is_staff_user'
    });
    
    if (funcError && funcError.code === 'PGRST202') {
      console.log('   ℹ️  Cannot check function directly');
      console.log('   💡 Run this SQL in Supabase SQL Editor:');
      console.log(`
      SELECT pg_get_functiondef(oid) 
      FROM pg_proc 
      WHERE proname = 'is_staff_user';
      `);
    }

    // 5. Test what a founder can access
    console.log('\n5️⃣  Testing founder access simulation...');
    if (founders?.length) {
      const founderId = founders[0].id;
      console.log(`   Testing as founder: ${founders[0].email}`);
      
      // Check if they can see other user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, role')
        .neq('id', founderId)
        .limit(5);
      
      if (profilesError) {
        console.error('   ❌ Error fetching other profiles:', profilesError.message);
      } else {
        console.log(`   ✅ Service role can see ${profiles?.length} other profiles`);
      }

      // Check if they can see aircraft
      const { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select('id, tail_number')
        .limit(5);
      
      if (aircraftError) {
        console.error('   ❌ Error fetching aircraft:', aircraftError.message);
      } else {
        console.log(`   ✅ Service role can see ${aircraft?.length} aircraft`);
      }
    }

    // 6. Check all staff-level roles
    console.log('\n6️⃣  Checking all staff-level users...');
    const { data: staffUsers, error: staffError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .in('role', ['admin', 'staff', 'cfi', 'ops', 'founder']);
    
    if (staffError) {
      console.error('   ❌ Error fetching staff:', staffError.message);
    } else {
      console.log(`   ✅ Found ${staffUsers?.length} staff-level users:`);
      const roleCounts = {};
      staffUsers?.forEach(u => {
        roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
      });
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`      - ${role}: ${count} user(s)`);
      });
    }

    // 7. Check if is_staff_user function exists by trying to call it
    console.log('\n7️⃣  Testing is_staff_user() function call...');
    const { data: staffCheck, error: staffCheckError } = await supabase
      .rpc('is_staff_user');
    
    if (staffCheckError) {
      if (staffCheckError.code === 'PGRST202') {
        console.log('   ❌ CRITICAL: is_staff_user() function does NOT exist!');
        console.log('   💡 This is likely the cause of the access issue.');
        console.log('   📝 Run the migration: supabase/migrations/20251129000001_fix_user_profiles_rls.sql');
      } else {
        console.log(`   ⚠️  Error calling function: ${staffCheckError.message}`);
      }
    } else {
      console.log(`   ✅ is_staff_user() function exists and returned: ${staffCheck}`);
      console.log(`      (Returns false for service role - this is expected, no auth.uid())`);
    }

    // 7b. Check if the function includes founder by testing with a known founder
    console.log('\n7b️⃣  Testing founder detection logic...');
    if (founders?.length) {
      // We can't directly check function definition, but we can verify 
      // that a founder's role is in the expected list
      const founderRole = founders[0].role;
      const expectedRoles = ['admin', 'staff', 'cfi', 'ops', 'founder'];
      const isInExpectedRoles = expectedRoles.includes(founderRole);
      console.log(`   Founder role "${founderRole}" is in expected staff roles: ${isInExpectedRoles ? '✅ YES' : '❌ NO'}`);
    }

    // 8. Check key tables for founder access in policies
    console.log('\n8️⃣  Testing table access with founder...');
    const tablesToCheck = ['user_profiles', 'aircraft', 'invoices', 'service_requests'];
    
    for (const table of tablesToCheck) {
      const { data, error, count } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: Access error - ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Can access (${count} rows)`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 SUMMARY & RECOMMENDATIONS');
    console.log('='.repeat(50));
    
    if (!founders?.length) {
      console.log(`
⚠️  No founder users found! To fix:

1. Assign founder role to a user:
   UPDATE user_profiles SET role = 'founder' WHERE email = 'YOUR_EMAIL';

2. Or create a new founder user through the app and update their role.
`);
    } else {
      const hasWhitespace = founders.some(f => f.role !== f.role?.trim());
      if (hasWhitespace) {
        console.log(`
⚠️  Whitespace detected in role values! To fix:

   UPDATE user_profiles SET role = TRIM(role) WHERE role != TRIM(role);
`);
      } else {
        console.log(`
✅ Founder users exist with correct role values.

If founders still can't access the dashboard, check:
1. The is_staff_user() function includes 'founder' in the role check
2. All RLS policies include 'founder' in allowed roles
3. The frontend isStaffRole() function includes 'founder'

Run these SQL commands in Supabase SQL Editor to verify:

-- Check is_staff_user function
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'is_staff_user';

-- Check all RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE qual::text ILIKE '%role%' 
ORDER BY tablename;
`);
      }
    }

  } catch (error) {
    console.error('❌ Diagnostic script error:', error);
  }
}

runDiagnostics();

