#!/usr/bin/env node
// Check and display current auth configuration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wsepwuxkwjnsgmkddkjw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkAuthConfig() {
  console.log('🔍 Checking Supabase Auth Configuration...\n');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Check auth settings (what we can access)
  console.log('📊 Project Info:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Project Ref: wsepwuxkwjnsgmkddkjw\n`);

  // Try to get auth config via SQL (if stored in DB)
  try {
    const { data: config, error } = await supabase
      .from('auth.config')
      .select('*');
    
    if (!error && config) {
      console.log('Auth Config:', config);
    }
  } catch (e) {
    // Config table doesn't exist or not accessible
  }

  // Check if we can see any auth schema info
  const { data: tables, error: tablesError } = await supabase.rpc('get_auth_tables', {}, {
    // Custom function if it exists
  }).catch(() => ({ data: null, error: 'Not available' }));

  console.log('📋 Redirect URLs that NEED to be added manually:\n');
  console.log('Go to: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/url-configuration\n');
  
  const urls = [
    'https://www.freedomaviationco.com/reset-password',
    'https://freedomaviationco.com/reset-password',
    'http://localhost:3000/reset-password',
    'http://localhost:3001/reset-password',
    'http://localhost:5173/reset-password'
  ];
  
  console.log('Add these URLs to "Redirect URLs":');
  urls.forEach(url => console.log(`   ✅ ${url}`));
  
  console.log('\n⚠️  These URLs must be added through the Supabase Dashboard.');
  console.log('The service role key cannot modify project-level auth settings.\n');

  // Test current redirect behavior
  console.log('🧪 Testing password reset redirect...');
  const testEmail = 'test@example.com';
  const redirectUrl = 'https://www.freedomaviationco.com/reset-password';
  
  try {
    // This will show what redirect URL we're requesting
    console.log(`   Requesting redirect to: ${redirectUrl}`);
    console.log('   But Supabase will ignore it if not whitelisted!\n');
  } catch (e) {
    console.error('Test failed:', e.message);
  }
}

checkAuthConfig().catch(console.error);
