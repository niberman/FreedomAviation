#!/usr/bin/env node
// Test password reset functionality

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wsepwuxkwjnsgmkddkjw.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODg5ODUsImV4cCI6MjA3NTM2NDk4NX0.B4KktUFp_WLh55A5ZEP64NApI_ZttDZLA1IqP5FK9BI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordReset() {
  console.log('🔍 Testing Password Reset Configuration\n');
  
  console.log('📊 Supabase Configuration:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Project Ref: wsepwuxkwjnsgmkddkjw\n`);

  // Test sending a password reset email
  const testEmail = 'nibthebib@gmail.com';
  console.log(`📧 Testing password reset for: ${testEmail}`);
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'https://www.freedomaviationco.com/reset-password'
    });
    
    if (error) {
      console.error('❌ Error sending reset email:', error.message);
    } else {
      console.log('✅ Password reset email sent successfully!');
      console.log('   Check your email for the reset link.');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
  
  console.log('\n📋 Debugging Tips:');
  console.log('1. Check the browser console when clicking the reset link');
  console.log('2. Look for these console logs:');
  console.log('   - [AuthRedirectHandler] Recovery token detected');
  console.log('   - [ResetPassword] Recovery token found');
  console.log('   - Auth state change: PASSWORD_RECOVERY');
  console.log('\n3. Common issues:');
  console.log('   - Token expired (reset links expire after 1 hour)');
  console.log('   - User already used this token');
  console.log('   - Email verification required first');
  console.log('   - Wrong redirect URL configuration');
  
  // Check auth settings
  console.log('\n🔐 Current Auth State:');
  const { data: { session } } = await supabase.auth.getSession();
  console.log(`   Session: ${session ? 'Active' : 'None'}`);
  
  // Listen for auth changes
  console.log('\n👂 Listening for auth changes (30 seconds)...');
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log(`   Auth event: ${event}, Session: ${session ? 'Present' : 'None'}`);
  });
  
  setTimeout(() => {
    subscription.unsubscribe();
    console.log('\n✅ Test complete');
    process.exit(0);
  }, 30000);
}

testPasswordReset().catch(console.error);
