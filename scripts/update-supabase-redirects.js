#!/usr/bin/env node
// Update Supabase Auth redirect URLs via Management API
// Note: This requires a Supabase access token with management permissions

const https = require('https');
require('dotenv').config({ path: './env.local' });

// Configuration
const PROJECT_REF = 'wsepwuxkwjnsgmkddkjw';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Redirect URLs to add
const REDIRECT_URLS = [
  'https://www.freedomaviationco.com/reset-password',
  'https://freedomaviationco.com/reset-password',
  'http://localhost:3000/reset-password',
  'http://localhost:3001/reset-password',
  'http://localhost:5173/reset-password'
];

async function updateRedirectURLs() {
  console.log('🔧 Attempting to update Supabase redirect URLs...');
  
  // Note: The Supabase Management API requires special access tokens
  // that are different from service role keys. Without proper access,
  // we cannot programmatically update these settings.
  
  console.log('\n⚠️  Cannot update redirect URLs programmatically.');
  console.log('The Supabase Management API requires special access tokens.\n');
  
  console.log('📋 Please add these URLs manually in the Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/url-configuration\n');
  
  console.log('Add these redirect URLs:');
  REDIRECT_URLS.forEach(url => console.log(`   - ${url}`));
  
  console.log('\nAlternatively, you can use the Supabase CLI if you have it configured:');
  console.log('supabase projects api-keys --project-ref wsepwuxkwjnsgmkddkjw');
}

updateRedirectURLs().catch(console.error);
