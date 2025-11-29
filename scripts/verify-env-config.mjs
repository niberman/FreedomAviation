#!/usr/bin/env node

/**
 * Verify environment configuration for main and preview branches
 * Ensures API keys match the correct Supabase projects
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Expected project refs
const MAIN_PROJECT_REF = 'wsepwuxkwjnsgmkddkjw';
const PREVIEW_PROJECT_REF = 'frarfaidvppulsemvogd';

function parseEnvFile(path) {
  try {
    const content = readFileSync(path, 'utf-8');
    const vars = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return vars;
  } catch (e) {
    return null;
  }
}

function extractProjectRef(url) {
  const match = url.match(/https:\/\/([a-z]+)\.supabase\.co/);
  return match ? match[1] : null;
}

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (e) {
    return null;
  }
}

console.log('🔍 Verifying Environment Configuration\n');
console.log('═'.repeat(70) + '\n');

// Load environment files
const mainEnv = parseEnvFile(join(projectRoot, 'env.local'));
const previewEnv = parseEnvFile(join(projectRoot, '.env.preview'));

let errors = [];
let warnings = [];

// ============================================================================
// MAIN BRANCH VERIFICATION
// ============================================================================

console.log('📦 Main Branch (Production) - env.local\n');

if (!mainEnv) {
  console.log('❌ File not found or not readable\n');
  errors.push('Main env file missing');
} else {
  // Check URL
  const mainUrl = mainEnv.SUPABASE_URL || mainEnv.NEXT_PUBLIC_SUPABASE_URL;
  const mainRef = extractProjectRef(mainUrl);
  
  if (mainRef === MAIN_PROJECT_REF) {
    console.log(`✅ URL: ${mainUrl}`);
    console.log(`   Project Ref: ${mainRef} (correct)\n`);
  } else {
    console.log(`❌ URL: ${mainUrl}`);
    console.log(`   Project Ref: ${mainRef} (expected: ${MAIN_PROJECT_REF})\n`);
    errors.push('Main URL points to wrong project');
  }
  
  // Check Anon Key
  const mainAnonKey = mainEnv.SUPABASE_ANON_KEY || mainEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (mainAnonKey) {
    const payload = decodeJWT(mainAnonKey);
    if (payload && payload.ref === MAIN_PROJECT_REF) {
      console.log(`✅ Anon Key: Valid for ${payload.ref}`);
      console.log(`   Role: ${payload.role}\n`);
    } else if (payload) {
      console.log(`❌ Anon Key: Points to ${payload.ref} (expected: ${MAIN_PROJECT_REF})\n`);
      errors.push('Main anon key is for wrong project');
    } else {
      console.log(`⚠️  Anon Key: Could not decode\n`);
      warnings.push('Main anon key format issue');
    }
  } else {
    console.log('❌ Anon Key: Missing\n');
    errors.push('Main anon key missing');
  }
  
  // Check Service Role Key
  const mainServiceKey = mainEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (mainServiceKey) {
    const payload = decodeJWT(mainServiceKey);
    if (payload && payload.ref === MAIN_PROJECT_REF && payload.role === 'service_role') {
      console.log(`✅ Service Role Key: Valid for ${payload.ref}`);
      console.log(`   Role: ${payload.role}\n`);
    } else if (payload) {
      console.log(`❌ Service Role Key: Points to ${payload.ref} (expected: ${MAIN_PROJECT_REF})\n`);
      errors.push('Main service key is for wrong project');
    } else {
      console.log(`⚠️  Service Role Key: Could not decode\n`);
      warnings.push('Main service key format issue');
    }
  } else {
    console.log('❌ Service Role Key: Missing\n');
    errors.push('Main service key missing');
  }
}

// ============================================================================
// PREVIEW BRANCH VERIFICATION
// ============================================================================

console.log('═'.repeat(70) + '\n');
console.log('🧪 Preview Branch - .env.preview\n');

if (!previewEnv) {
  console.log('❌ File not found or not readable\n');
  errors.push('Preview env file missing');
} else {
  // Check URL
  const previewUrl = previewEnv.SUPABASE_URL || previewEnv.NEXT_PUBLIC_SUPABASE_URL;
  const previewRef = extractProjectRef(previewUrl);
  
  if (previewRef === PREVIEW_PROJECT_REF) {
    console.log(`✅ URL: ${previewUrl}`);
    console.log(`   Project Ref: ${previewRef} (correct)\n`);
  } else {
    console.log(`❌ URL: ${previewUrl}`);
    console.log(`   Project Ref: ${previewRef} (expected: ${PREVIEW_PROJECT_REF})\n`);
    errors.push('Preview URL points to wrong project');
  }
  
  // Check Anon Key
  const previewAnonKey = previewEnv.SUPABASE_ANON_KEY || previewEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (previewAnonKey) {
    const payload = decodeJWT(previewAnonKey);
    if (payload && payload.ref === PREVIEW_PROJECT_REF) {
      console.log(`✅ Anon Key: Valid for ${payload.ref}`);
      console.log(`   Role: ${payload.role}\n`);
    } else if (payload) {
      console.log(`❌ Anon Key: Points to ${payload.ref} (expected: ${PREVIEW_PROJECT_REF})\n`);
      errors.push('Preview anon key is for wrong project');
    } else {
      console.log(`⚠️  Anon Key: Could not decode\n`);
      warnings.push('Preview anon key format issue');
    }
  } else {
    console.log('❌ Anon Key: Missing\n');
    errors.push('Preview anon key missing');
  }
  
  // Check Service Role Key
  const previewServiceKey = previewEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (previewServiceKey) {
    const payload = decodeJWT(previewServiceKey);
    if (payload && payload.ref === PREVIEW_PROJECT_REF && payload.role === 'service_role') {
      console.log(`✅ Service Role Key: Valid for ${payload.ref}`);
      console.log(`   Role: ${payload.role}\n`);
    } else if (payload) {
      console.log(`❌ Service Role Key: Points to ${payload.ref} (expected: ${PREVIEW_PROJECT_REF})\n`);
      errors.push('Preview service key is for wrong project');
    } else {
      console.log(`⚠️  Service Role Key: Could not decode\n`);
      warnings.push('Preview service key format issue');
    }
  } else {
    console.log('❌ Service Role Key: Missing\n');
    errors.push('Preview service key missing');
  }
}

// ============================================================================
// CROSS-CONTAMINATION CHECK
// ============================================================================

console.log('═'.repeat(70) + '\n');
console.log('🔒 Cross-Contamination Check\n');

if (mainEnv && previewEnv) {
  const mainUrl = mainEnv.SUPABASE_URL || mainEnv.NEXT_PUBLIC_SUPABASE_URL;
  const previewUrl = previewEnv.SUPABASE_URL || previewEnv.NEXT_PUBLIC_SUPABASE_URL;
  
  if (mainUrl === previewUrl) {
    console.log('❌ CRITICAL: Main and preview use the SAME URL!\n');
    errors.push('CRITICAL: URL collision between main and preview');
  } else {
    console.log('✅ Main and preview use different URLs (correct)\n');
  }
  
  const mainAnonKey = mainEnv.SUPABASE_ANON_KEY || mainEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const previewAnonKey = previewEnv.SUPABASE_ANON_KEY || previewEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (mainAnonKey === previewAnonKey) {
    console.log('❌ CRITICAL: Main and preview use the SAME anon key!\n');
    errors.push('CRITICAL: Anon key collision between main and preview');
  } else {
    console.log('✅ Main and preview use different anon keys (correct)\n');
  }
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('═'.repeat(70) + '\n');
console.log('📊 Configuration Summary\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✨ All environment configurations are correct!\n');
  console.log('📋 Usage Guide:\n');
  console.log('   Production:');
  console.log('   • Use: env.local');
  console.log('   • Project: wsepwuxkwjnsgmkddkjw (main branch)\n');
  console.log('   Preview/Testing:');
  console.log('   • Use: .env.preview');
  console.log('   • Project: frarfaidvppulsemvogd (preview branch)\n');
  console.log('   Switch between environments:');
  console.log('   • cp .env.preview .env (for local testing with preview)');
  console.log('   • cp env.local .env (for local testing with production)\n');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log('❌ Errors Found:\n');
    errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach((warn, i) => console.log(`   ${i + 1}. ${warn}`));
    console.log('');
  }
  
  console.log('💡 How to Fix:\n');
  console.log('   1. Get keys from Supabase dashboard');
  console.log('   2. Main: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/settings/api');
  console.log('   3. Preview: https://supabase.com/dashboard/project/frarfaidvppulsemvogd/settings/api');
  console.log('   4. Update the corresponding env files\n');
  
  process.exit(1);
}

