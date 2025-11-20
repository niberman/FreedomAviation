#!/usr/bin/env node
// Execute SQL directly via Supabase Management API
// No setup required - uses personal access token

import https from 'https';
import { readFileSync } from 'fs';

const PROJECT_REF = 'wsepwuxkwjnsgmkddkjw';
const ACCESS_TOKEN = 'sbp_dcec790f9d9405e2ed98812c7ecf3c35d7a9f3b8';

async function makeRequest(path, method = 'POST', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, statusCode: res.statusCode, body: body });
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          resolve({ success: true, statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function executeSql(sql) {
  console.log('🔧 Executing SQL via Supabase Management API...\n');
  console.log('Project:', PROJECT_REF);
  console.log('SQL Preview:', sql.substring(0, 150) + (sql.length > 150 ? '...' : ''));
  console.log('');

  try {
    const result = await makeRequest(`/projects/${PROJECT_REF}/database/query`, 'POST', {
      query: sql
    });
    
    console.log('✅ SQL executed successfully!');
    console.log('Status:', result.statusCode);
    if (result.body) {
      console.log('Response:', result.body);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    throw error;
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage:');
  console.error('  node scripts/execute-sql-mgmt-api.js "SELECT * FROM user_profiles LIMIT 5"');
  console.error('  node scripts/execute-sql-mgmt-api.js -f migrations/some-file.sql');
  process.exit(1);
}

let sql;

if (args[0] === '-f' && args[1]) {
  const filePath = args[1];
  console.log(`📄 Reading SQL from: ${filePath}\n`);
  sql = readFileSync(filePath, 'utf8');
} else {
  sql = args.join(' ');
}

executeSql(sql).catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
