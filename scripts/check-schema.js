#!/usr/bin/env node
// Quick script to check Supabase schema using REST API
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking Supabase Database Schema...\n');
  
  // List of tables we're checking for
  const tablesToCheck = [
    'user_profiles',
    'aircraft', 
    'service_requests',
    'service_tasks',
    'memberships',
    'invoices',
    'invoice_lines',
    'membership_quotes',  // NEW - should exist after migration
    'support_tickets',    // OLD - should not exist or be deprecated
    'consumable_events',  // OLD - should not exist or be deprecated  
    'instruction_requests', // OLD - should not exist or be deprecated
    'email_notifications',
    'notification_preferences',
    'cfi_schedule',
    'google_calendar_tokens',
    'maintenance',
    'flight_logs'
  ];
  
  console.log('📊 Checking which tables exist:\n');
  
  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ${table.padEnd(30)} - DOES NOT EXIST`);
        } else {
          console.log(`⚠️  ${table.padEnd(30)} - ERROR: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table.padEnd(30)} - EXISTS (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`⚠️  ${table.padEnd(30)} - ERROR: ${err.message}`);
    }
  }
  
  console.log('\n---\n');
  
  // Check aircraft columns
  console.log('🔍 Checking aircraft table columns:\n');
  
  try {
    const { data: aircraft } = await supabase
      .from('aircraft')
      .select('*')
      .limit(1);
    
    if (aircraft && aircraft.length > 0) {
      const columns = Object.keys(aircraft[0]);
      const hobbsColumns = columns.filter(c => c.includes('hobb'));
      const tachColumns = columns.filter(c => c.includes('tach'));
      
      console.log('Hobbs columns:', hobbsColumns.join(', ') || 'none');
      console.log('Tach columns:', tachColumns.join(', ') || 'none');
      
      if (hobbsColumns.includes('hobbs_hours')) {
        console.log('✅ Uses hobbs_hours (correct)');
      }
      if (hobbsColumns.includes('hobbs_time')) {
        console.log('⚠️  Still has hobbs_time (deprecated)');
      }
      if (tachColumns.includes('tach_hours')) {
        console.log('✅ Uses tach_hours (correct)');
      }
      if (tachColumns.includes('tach_time')) {
        console.log('⚠️  Still has tach_time (deprecated)');
      }
    } else {
      console.log('⚠️  No aircraft records to check columns');
    }
  } catch (err) {
    console.log('❌ Error checking aircraft columns:', err.message);
  }
  
  console.log('\n---\n');
  console.log('✅ Schema check complete!\n');
}

checkSchema().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

