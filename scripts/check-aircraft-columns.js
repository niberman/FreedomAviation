#!/usr/bin/env node
// Check aircraft table structure
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('🔍 Checking aircraft table structure...\n');
  
  // Try to insert a test aircraft to see what columns are accepted
  const testData = {
    tail_number: 'N999TEST',
    make: 'Test',
    model: 'Test Model',
    hobbs_hours: 100,
    tach_hours: 95,
  };
  
  console.log('📝 Attempting insert with hobbs_hours/tach_hours...');
  const { data, error } = await supabase
    .from('aircraft')
    .insert(testData)
    .select()
    .single();
  
  if (error) {
    console.log('❌ Error:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
  } else {
    console.log('✅ Insert successful! Columns accepted.');
    console.log('   Returned data columns:', Object.keys(data).join(', '));
    
    // Clean up test data
    await supabase.from('aircraft').delete().eq('id', data.id);
    console.log('   Test record cleaned up');
  }
  
  console.log('\n---\n');
  
  // Try with old column names to see if they exist
  const testDataOld = {
    tail_number: 'N998TEST',
    make: 'Test',
    model: 'Test Model',
    hobbs_time: 100,
    tach_time: 95,
  };
  
  console.log('📝 Attempting insert with hobbs_time/tach_time (old names)...');
  const { data: data2, error: error2 } = await supabase
    .from('aircraft')
    .insert(testDataOld)
    .select()
    .single();
  
  if (error2) {
    console.log('❌ Error (expected if columns removed):', error2.message);
  } else {
    console.log('⚠️  Old column names still work!');
    console.log('   This means migration has NOT been run yet');
    
    // Clean up
    await supabase.from('aircraft').delete().eq('id', data2.id);
    console.log('   Test record cleaned up');
  }
}

checkColumns().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

