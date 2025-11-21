#!/usr/bin/env node

/**
 * Pull complete schema from Supabase
 * This uses direct SQL queries through Supabase to extract schema information
 */

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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    throw new Error(`SQL execution failed: ${error.message}`);
  }
  
  return data;
}

async function getSchemaInfo() {
  console.log('Fetching schema information from Supabase...\n');
  
  const schemaQueries = {
    // Get enum types
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
      SELECT 
        c.relname as table_name,
        obj_description(c.oid) as table_comment
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relname NOT LIKE 'pg_%'
      ORDER BY c.relname
    `,
    
    // Get columns for all tables
    columns: `
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.udt_name,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.ordinal_position,
        pgd.description as column_comment
      FROM information_schema.columns c
      LEFT JOIN pg_catalog.pg_statio_all_tables st ON c.table_name = st.relname
      LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid
        AND pgd.objsubid = c.ordinal_position
      WHERE c.table_schema = 'public'
        AND c.table_name NOT LIKE 'pg_%'
      ORDER BY c.table_name, c.ordinal_position
    `,
    
    // Get primary keys
    primaryKeys: `
      SELECT
        tc.table_name,
        tc.constraint_name,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.constraint_type = 'PRIMARY KEY'
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name
    `,
    
    // Get foreign keys
    foreignKeys: `
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `,
    
    // Get indexes
    indexes: `
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    `,
    
    // Get RLS policies  
    policies: `
      SELECT
        schemaname,
        tablename,
        policyname,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `,
    
    // Get functions
    functions: `
      SELECT
        p.proname as name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        AND p.proname NOT LIKE 'pg_%'
      ORDER BY p.proname
    `,
    
    // Get triggers
    triggers: `
      SELECT
        c.relname as table_name,
        t.tgname as trigger_name,
        p.proname as function_name,
        CASE 
          WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
          WHEN t.tgtype & 64 = 64 THEN 'INSTEAD OF'
          ELSE 'AFTER'
        END as timing,
        CASE
          WHEN t.tgtype & 4 = 4 THEN 'INSERT'
          WHEN t.tgtype & 8 = 8 THEN 'DELETE'
          WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
          ELSE 'UNKNOWN'
        END as event
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE n.nspname = 'public'
        AND NOT t.tgisinternal
      ORDER BY c.relname, t.tgname
    `
  };
  
  const results = {};
  
  for (const [key, query] of Object.entries(schemaQueries)) {
    try {
      console.log(`Fetching ${key}...`);
      const { data, error } = await supabase.rpc('exec_sql', { query });
      
      if (error) {
        console.error(`Error fetching ${key}:`, error.message);
        results[key] = [];
      } else {
        results[key] = data || [];
        console.log(`✓ Found ${results[key].length} ${key}`);
      }
    } catch (e) {
      console.error(`Exception fetching ${key}:`, e.message);
      results[key] = [];
    }
  }
  
  return results;
}

async function generateSchemaSQL(schemaInfo) {
  let sql = `-- Freedom Aviation Database Schema for Supabase
-- Generated on ${new Date().toISOString()}
-- Run this in Supabase SQL Editor to recreate the schema

`;

  // Add enum types
  if (schemaInfo.enums && schemaInfo.enums.length > 0) {
    sql += `-- Create enum types\n`;
    for (const enumType of schemaInfo.enums) {
      const values = enumType.values.map(v => `'${v}'`).join(', ');
      sql += `CREATE TYPE ${enumType.name} AS ENUM (${values});\n`;
    }
    sql += '\n';
  }
  
  // Add tables with columns
  if (schemaInfo.tables && schemaInfo.tables.length > 0) {
    for (const table of schemaInfo.tables) {
      if (table.table_comment) {
        sql += `-- ${table.table_comment}\n`;
      }
      
      sql += `CREATE TABLE public.${table.table_name} (\n`;
      
      const columns = schemaInfo.columns.filter(c => c.table_name === table.table_name);
      const columnDefs = columns.map(col => {
        let def = `  ${col.column_name} `;
        
        // Add data type
        if (col.data_type === 'USER-DEFINED') {
          def += col.udt_name;
        } else if (col.data_type === 'character varying') {
          def += `TEXT`;
        } else if (col.data_type === 'timestamp with time zone') {
          def += 'TIMESTAMPTZ';
        } else if (col.data_type === 'numeric') {
          def += `DECIMAL(${col.numeric_precision}, ${col.numeric_scale})`;
        } else {
          def += col.data_type.toUpperCase();
        }
        
        // Add constraints
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        
        return def;
      });
      
      sql += columnDefs.join(',\n') + '\n);\n\n';
      
      // Add column comments
      for (const col of columns) {
        if (col.column_comment) {
          sql += `COMMENT ON COLUMN public.${table.table_name}.${col.column_name} IS '${col.column_comment}';\n`;
        }
      }
      
      if (columns.some(c => c.column_comment)) {
        sql += '\n';
      }
    }
  }
  
  // Add indexes
  if (schemaInfo.indexes && schemaInfo.indexes.length > 0) {
    sql += `-- Create indexes for performance\n`;
    for (const index of schemaInfo.indexes) {
      sql += `${index.indexdef};\n`;
    }
    sql += '\n';
  }
  
  // Add RLS policies
  if (schemaInfo.policies && schemaInfo.policies.length > 0) {
    sql += `-- Enable Row Level Security (RLS)\n`;
    const tables = [...new Set(schemaInfo.policies.map(p => p.tablename))];
    for (const table of tables) {
      sql += `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;\n`;
    }
    sql += '\n';
    
    sql += `-- RLS Policies\n`;
    for (const policy of schemaInfo.policies) {
      sql += `CREATE POLICY "${policy.policyname}" ON public.${policy.tablename}\n`;
      sql += `  FOR ${policy.cmd}`;
      if (policy.qual) {
        sql += ` USING (${policy.qual})`;
      }
      if (policy.with_check) {
        sql += `\n  WITH CHECK (${policy.with_check})`;
      }
      sql += ';\n\n';
    }
  }
  
  // Add functions
  if (schemaInfo.functions && schemaInfo.functions.length > 0) {
    sql += `-- Functions\n`;
    for (const func of schemaInfo.functions) {
      sql += `${func.definition}\n\n`;
    }
  }
  
  // Add triggers
  if (schemaInfo.triggers && schemaInfo.triggers.length > 0) {
    sql += `-- Triggers\n`;
    for (const trigger of schemaInfo.triggers) {
      sql += `CREATE TRIGGER ${trigger.trigger_name} ${trigger.timing} ${trigger.event} ON public.${trigger.table_name}\n`;
      sql += `  FOR EACH ROW EXECUTE FUNCTION ${trigger.function_name}();\n\n`;
    }
  }
  
  return sql;
}

async function main() {
  try {
    console.log('Connecting to Supabase...');
    console.log(`URL: ${supabaseUrl}\n`);
    
    // Fetch schema information
    const schemaInfo = await getSchemaInfo();
    
    // Generate SQL
    console.log('\nGenerating schema SQL...');
    const sql = await generateSchemaSQL(schemaInfo);
    
    // Write to file
    const outputPath = path.join(__dirname, '..', 'supabase-schema-generated.sql');
    fs.writeFileSync(outputPath, sql);
    
    console.log(`\n✓ Schema exported to: ${outputPath}`);
    console.log('\nPlease review the generated file and update supabase-schema.sql as needed.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nNote: This script requires an exec_sql() RPC function in your database.');
    console.error('You may need to create it first. Check the Supabase documentation.');
    process.exit(1);
  }
}

main();


