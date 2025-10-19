#!/usr/bin/env node

/**
 * Test Decimal Precision Fix
 * 
 * This script tests that the decimal precision fix works correctly.
 * Run this after applying the database migration.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDecimalPrecision() {
  console.log('🔧 Testing Decimal Precision Fix');
  console.log('================================\n');

  try {
    // Test 1: Check table schemas
    console.log('📋 Test 1: Checking table schemas...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type, numeric_precision, numeric_scale')
      .in('table_name', ['location_sessions', 'location_achievements', 'location_level_requirements', 'location_level_achievements'])
      .like('column_name', '%hours%');

    if (columnsError) {
      console.error('❌ Error checking schemas:', columnsError);
      return;
    }

    console.log('✅ Table schemas:');
    columns.forEach(col => {
      console.log(`   ${col.table_name}.${col.column_name}: ${col.data_type}(${col.numeric_precision},${col.numeric_scale})`);
    });

    // Test 2: Try inserting a large time value
    console.log('\n📊 Test 2: Testing large time value insertion...');
    const testAchievement = {
      user_id: '00000000-0000-0000-0000-000000000000',
      location_id: 'test-location',
      location_name: 'Test Location',
      target_hours: 999.999, // Large value that should work with DECIMAL(8,3)
      achieved_hours: 999.999,
      achievement_date: new Date().toISOString(),
      is_milestone: true
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('location_achievements')
      .insert(testAchievement)
      .select();

    if (insertError) {
      console.error('❌ Error inserting large time value:', insertError);
    } else {
      console.log('✅ Large time value inserted successfully');
      console.log('   Inserted:', insertResult[0]);
    }

    // Test 3: Test level requirements with large values
    console.log('\n🎯 Test 3: Testing level requirements...');
    const testLevelReq = {
      location_id: 'test-location',
      level: 10,
      required_time_hours: 999.999
    };

    const { data: levelResult, error: levelError } = await supabase
      .from('location_level_requirements')
      .insert(testLevelReq)
      .select();

    if (levelError) {
      console.error('❌ Error inserting level requirement:', levelError);
    } else {
      console.log('✅ Level requirement inserted successfully');
    }

    console.log('\n🎉 Decimal precision fix test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. The database should now handle larger time values');
    console.log('2. Try creating achievements with longer time requirements');
    console.log('3. The numeric field overflow error should be resolved');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testDecimalPrecision();
