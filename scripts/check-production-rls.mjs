#!/usr/bin/env node
/**
 * Check production RLS policies and is_staff_user function
 * Run with: node scripts/check-production-rls.mjs
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

console.log(`🔍 Checking Production Database: ${supabaseUrl}\n`);
console.log('='.repeat(60));

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkProduction() {
  try {
    // 1. Get list of all RLS policies mentioning 'role'
    console.log('\n1️⃣  Fetching RLS policies from pg_policies...');
    
    // Use raw SQL via RPC if available, otherwise try direct table access
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies_with_founder');
    
    if (policiesError) {
      console.log('   ℹ️  Custom RPC not available, creating temporary function...');
      
      // Create a temporary function to check policies
      const createFuncResult = await supabase.rpc('exec_sql', {
        sql: `
          SELECT tablename, policyname, 
                 CASE WHEN qual::text ILIKE '%founder%' THEN 'YES' ELSE 'NO' END as has_founder
          FROM pg_policies 
          WHERE schemaname = 'public'
          ORDER BY tablename, policyname;
        `
      });
      
      if (createFuncResult.error) {
        console.log('   ⚠️  Cannot execute SQL directly.');
        console.log('\n   📋 Please run this SQL in Supabase SQL Editor:\n');
        console.log(`
-- Check which policies include 'founder'
SELECT 
  tablename, 
  policyname,
  cmd,
  CASE 
    WHEN qual::text ILIKE '%founder%' THEN '✅ YES' 
    ELSE '❌ NO' 
  END as includes_founder,
  LEFT(qual::text, 100) as policy_preview
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check is_staff_user function definition
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'is_staff_user';
        `);
      }
    } else {
      console.log('   ✅ Policies retrieved');
      policies?.forEach(p => {
        console.log(`      ${p.tablename}.${p.policyname}: founder=${p.has_founder}`);
      });
    }

    // 2. Test authenticated access for a founder
    console.log('\n2️⃣  Testing founder authentication flow...');
    
    const { data: founders } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('role', 'founder')
      .limit(1);
    
    if (!founders?.length) {
      console.log('   ❌ No founder users found in database!');
      return;
    }
    
    const founder = founders[0];
    console.log(`   Found founder: ${founder.email}`);
    
    // 3. Simulate what happens when founder logs in
    // Check if they can read their own profile (this is the first RLS check)
    console.log('\n3️⃣  Simulating founder login RLS checks...');
    
    // The issue is: when a founder authenticates, can they:
    // a) Read their own profile (required for StaffProtectedRoute)
    // b) Pass the isStaffRole check
    
    // Check a - using service role we can see if the profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('id', founder.id)
      .single();
    
    if (profileError) {
      console.log(`   ❌ Error fetching founder profile: ${profileError.message}`);
    } else {
      console.log(`   ✅ Founder profile accessible via service role`);
      console.log(`      Role value: "${profile.role}"`);
      
      // Check b - simulate isStaffRole check
      const STAFF_ROLES = ['admin', 'staff', 'cfi', 'ops', 'founder'];
      const trimmedRole = profile.role?.trim().toLowerCase();
      const isStaff = STAFF_ROLES.includes(trimmedRole);
      console.log(`   ${isStaff ? '✅' : '❌'} isStaffRole("${profile.role}") = ${isStaff}`);
    }

    // 4. Check key RLS policies for user_profiles table
    console.log('\n4️⃣  Critical Policy Check: user_profiles');
    console.log('   The following policies must exist and allow founder access:\n');
    
    const criticalPolicies = [
      { 
        name: 'Users can view own profile', 
        requirement: 'auth.uid() = id',
        founderNeeds: 'Just needs to be authenticated'
      },
      { 
        name: 'Staff can view all profiles', 
        requirement: 'is_staff_user()',
        founderNeeds: 'is_staff_user() must include founder'
      }
    ];
    
    criticalPolicies.forEach(p => {
      console.log(`   📌 "${p.name}"`);
      console.log(`      Requirement: ${p.requirement}`);
      console.log(`      Founder needs: ${p.founderNeeds}\n`);
    });

    // 5. Final recommendation
    console.log('='.repeat(60));
    console.log('\n📋 VERIFICATION STEPS FOR PRODUCTION:\n');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run this query to check is_staff_user function:\n');
    console.log(`   SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'is_staff_user';`);
    console.log('\n3. Verify the function contains:');
    console.log(`   AND role IN ('admin', 'staff', 'cfi', 'ops', 'founder')`);
    console.log('\n4. If "founder" is missing, run the migration:');
    console.log('   supabase/migrations/20251129000001_fix_user_profiles_rls.sql\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkProduction();

