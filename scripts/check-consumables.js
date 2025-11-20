#!/usr/bin/env node
// Check consumable_events data
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConsumables() {
  console.log('🔍 Checking consumable_events table data...\n');
  
  const { data, error } = await supabase
    .from('consumable_events')
    .select('*')
    .limit(20);
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No data in consumable_events');
    return;
  }
  
  console.log(`Found ${data.length} consumable events:\n`);
  
  data.forEach((row, idx) => {
    console.log(`${idx + 1}. ${row.kind} - ${row.quantity} ${row.unit}`);
    console.log(`   Aircraft: ${row.aircraft_id}`);
    console.log(`   Notes: ${row.notes || 'none'}`);
    console.log(`   Created: ${row.created_at}`);
    console.log('');
  });
  
  console.log('---\n');
  console.log('⚠️  Decision needed:');
  console.log('   Option A: Keep consumable_events table and revert our fix');
  console.log('   Option B: Migrate this data to service_requests');
  console.log('   Option C: Keep both tables (old for history, new for future)');
}

checkConsumables().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

