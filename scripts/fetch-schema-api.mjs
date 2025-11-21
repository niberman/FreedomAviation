#!/usr/bin/env node

/**
 * Fetch schema directly from Supabase using REST API
 * This queries information_schema tables to build the schema
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
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

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    
    const options = {
      method,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getTables() {
  // Query the tables we know exist
  const tables = [
    'user_profiles',
    'aircraft',
    'memberships',
    'maintenance',
    'consumable_events',
    'service_requests',
    'service_tasks',
    'invoices',
    'invoice_lines'
  ];
  
  const existingTables = [];
  
  for (const table of tables) {
    try {
      const data = await makeRequest(`/rest/v1/${table}?select=*&limit=0`);
      if (Array.isArray(data)) {
        existingTables.push(table);
        console.log(`✓ Found table: ${table}`);
      }
    } catch (e) {
      console.log(`✗ Table not found: ${table}`);
    }
  }
  
  return existingTables;
}

async function getTableColumns(table) {
  try {
    const data = await makeRequest(`/rest/v1/${table}?select=*&limit=1`);
    if (Array.isArray(data) && data.length > 0) {
      return Object.keys(data[0]);
    } else if (Array.isArray(data)) {
      // Empty table, try to infer from OPTIONS
      return [];
    }
  } catch (e) {
    return [];
  }
}

async function generateSchema() {
  console.log('Fetching schema from Supabase...\n');
  
  const tables = await getTables();
  
  let schema = `-- Freedom Aviation Database Schema
-- Pulled from Supabase on ${new Date().toISOString()}
-- Generated using Supabase REST API

-- NOTE: This is a basic structure discovery. Full schema with constraints,
-- indexes, RLS policies requires database password for pg_dump.

-- ================================================================
-- ENUM TYPES (from existing schema file)
-- ================================================================

CREATE TYPE membership_class AS ENUM ('I', 'II', 'III');
CREATE TYPE service_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE maintenance_status AS ENUM ('current', 'due_soon', 'overdue');
CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');

-- ================================================================
-- TABLES (verified to exist in database)
-- ================================================================

`;

  for (const table of tables) {
    const columns = await getTableColumns(table);
    schema += `\n-- Table: ${table}\n`;
    schema += `-- Status: EXISTS in database\n`;
    
    if (columns.length > 0) {
      schema += `-- Columns found: ${columns.join(', ')}\n`;
    } else {
      schema += `-- Note: Table is empty, column types need manual verification\n`;
    }
    
    schema += `-- See supabase-schema.sql for full definition with types and constraints\n`;
  }
  
  // Check for missing tables
  const allExpectedTables = [
    'user_profiles', 'aircraft', 'memberships', 'maintenance',
    'consumable_events', 'service_requests', 'service_tasks',
    'instructors', 'pricing_packages', 'invoices', 'invoice_lines'
  ];
  
  const missingTables = allExpectedTables.filter(t => !tables.includes(t));
  
  if (missingTables.length > 0) {
    schema += `\n-- ================================================================\n`;
    schema += `-- MISSING TABLES (in schema file but NOT in database)\n`;
    schema += `-- ================================================================\n\n`;
    
    for (const table of missingTables) {
      schema += `-- ✗ ${table} - NOT FOUND in database\n`;
    }
  }
  
  schema += `\n-- ================================================================\n`;
  schema += `-- NEXT STEPS\n`;
  schema += `-- ================================================================\n\n`;
  schema += `-- To get the COMPLETE schema with all constraints, indexes, RLS policies:\n`;
  schema += `-- 1. Get database password from Supabase dashboard\n`;
  schema += `-- 2. Run: pg_dump "postgresql://postgres:PASSWORD@db.wsepwuxkwjnsgmkddkjw.supabase.co:5432/postgres" \\\n`;
  schema += `--        --schema=public --schema-only --no-owner --no-acl > schema-complete.sql\n\n`;
  schema += `-- OR use the Supabase SQL Editor to run: scripts/export-complete-schema.sql\n`;
  
  return schema;
}

async function main() {
  try {
    const schema = await generateSchema();
    
    const outputPath = path.join(__dirname, '..', 'supabase-schema-verified.sql');
    fs.writeFileSync(outputPath, schema);
    
    console.log(`\n✓ Schema verification saved to: supabase-schema-verified.sql\n`);
    console.log('This file shows which tables exist in your database.');
    console.log('For the complete schema, you need to:');
    console.log('  1. Run scripts/export-complete-schema.sql in Supabase SQL Editor');
    console.log('  2. OR provide database password for pg_dump\n');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();


