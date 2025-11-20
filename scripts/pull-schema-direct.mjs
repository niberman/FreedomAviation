#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', 'env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getSchemaInfo() {
  console.log('Fetching complete schema from Supabase...\n');
  
  // Get enum types
  const { data: enums, error: enumsError } = await supabase
    .rpc('get_enum_types', {})
    .catch(() => ({ data: null, error: null }));
  
  // Get table info using SQL queries through the REST API
  // We'll query information_schema directly
  
  const queries = {
    // Get all enum types
    enums: `
      SELECT 
        t.typname as name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `,
    
    // Get all tables
    tables: `
      SELECT tablename as name
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `,
  };
  
  const results = {};
  
  // Try to execute raw SQL if possible
  for (const [key, sql] of Object.entries(queries)) {
    try {
      // Try using a custom RPC function if it exists
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });
      if (!error && data) {
        results[key] = data;
        console.log(`✓ Fetched ${key}: ${data.length} items`);
      }
    } catch (e) {
      console.log(`⚠ Could not fetch ${key} via RPC`);
    }
  }
  
  return results;
}

async function generateSchemaFromTables() {
  console.log('Generating schema by inspecting actual tables...\n');
  
  const tables = [
    'user_profiles',
    'aircraft',
    'memberships',
    'maintenance',
    'consumable_events',
    'service_requests',
    'service_tasks',
    'instructors',
    'pricing_packages',
    'invoices',
    'invoice_lines'
  ];
  
  let schema = `-- Freedom Aviation Database Schema
-- Generated from Supabase on ${new Date().toISOString()}
-- This schema was reverse-engineered from the live database

`;

  // For each table, try to get its structure
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error && data) {
        console.log(`✓ Table exists: ${table}`);
        schema += `-- Table: ${table} (verified exists)\n`;
        
        if (data.length > 0) {
          const sample = data[0];
          schema += `-- Sample columns: ${Object.keys(sample).join(', ')}\n`;
        }
        schema += `\n`;
      } else if (error) {
        console.log(`✗ Table not found or no access: ${table}`);
        schema += `-- Table: ${table} (NOT FOUND in database)\n\n`;
      }
    } catch (e) {
      console.log(`✗ Error checking ${table}: ${e.message}`);
    }
  }
  
  return schema;
}

async function main() {
  try {
    console.log('Connecting to Supabase...');
    console.log(`URL: ${supabaseUrl}\n`);
    
    // Try to get schema info
    const schemaInfo = await getSchemaInfo();
    
    // Generate basic schema from table inspection
    const basicSchema = await generateSchemaFromTables();
    
    // Write output
    const outputPath = path.join(__dirname, '..', 'supabase-schema-discovered.sql');
    fs.writeFileSync(outputPath, basicSchema);
    
    console.log(`\n✓ Basic schema info written to: supabase-schema-discovered.sql`);
    console.log('\nNOTE: This is a basic discovery. For complete schema with constraints,');
    console.log('indexes, and RLS policies, you need database password to use pg_dump.');
    console.log('\nGet your database password from:');
    console.log('https://app.supabase.com/project/wsepwuxkwjnsgmkddkjw/settings/database');
    console.log('\nThen run:');
    console.log('pg_dump "postgresql://postgres:YOUR_PASSWORD@db.wsepwuxkwjnsgmkddkjw.supabase.co:5432/postgres" --schema=public --schema-only --no-owner --no-acl > supabase-schema-complete.sql');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

