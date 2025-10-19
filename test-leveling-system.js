#!/usr/bin/env node

/**
 * Test Location Leveling System
 * 
 * This script tests the leveling system database functions and API endpoints.
 * Run this after applying the database schema.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please check your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLevelingSystem() {
  console.log('🎯 Testing Location Leveling System');
  console.log('===================================\n');

  try {
    // Test 1: Check if tables exist
    console.log('📋 Test 1: Checking database tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['location_levels', 'location_level_requirements', 'location_level_achievements']);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return;
    }

    if (tables.length === 3) {
      console.log('✅ All required tables exist');
    } else {
      console.log('❌ Missing tables. Please apply the database schema first.');
      console.log('Found tables:', tables.map(t => t.table_name));
      return;
    }

    // Test 2: Check level requirements
    console.log('\n📊 Test 2: Checking level requirements...');
    const { data: requirements, error: reqError } = await supabase
      .from('location_level_requirements')
      .select('location_id, level, required_time_hours')
      .eq('location_id', 'hub')
      .order('level')
      .limit(5);

    if (reqError) {
      console.error('❌ Error checking requirements:', reqError);
    } else {
      console.log('✅ Level requirements found:');
      requirements.forEach(req => {
        const minutes = Math.round(req.required_time_hours * 60);
        console.log(`   Level ${req.level}: ${minutes} minutes (${req.required_time_hours} hours)`);
      });
    }

    // Test 3: Test level calculation function
    console.log('\n🧮 Test 3: Testing level calculation function...');
    const { data: calcTest, error: calcError } = await supabase
      .rpc('calculate_level_time', { base_hours: 0.167, level: 3 });

    if (calcError) {
      console.error('❌ Error testing calculation function:', calcError);
    } else {
      const minutes = Math.round(calcTest * 60);
      console.log(`✅ Level 3 calculation: ${minutes} minutes (${calcTest} hours)`);
    }

    // Test 4: Test user level creation
    console.log('\n👤 Test 4: Testing user level creation...');
    const testUserId = '00000000-0000-0000-0000-000000000000';
    
    const { data: userLevel, error: levelError } = await supabase
      .rpc('get_or_create_user_level', {
        p_user_id: testUserId,
        p_location_id: 'hub',
        p_location_name: 'HUB'
      });

    if (levelError) {
      console.error('❌ Error creating user level:', levelError);
    } else {
      console.log('✅ User level created successfully:');
      console.log(`   Location: ${userLevel.location_name}`);
      console.log(`   Level: ${userLevel.current_level}`);
      console.log(`   Time spent: ${userLevel.total_time_spent_seconds} seconds`);
    }

    // Test 5: Test level completion check
    console.log('\n🎯 Test 5: Testing level completion check...');
    const { data: isCompleted, error: completionError } = await supabase
      .rpc('check_level_completion', {
        p_user_id: testUserId,
        p_location_id: 'hub',
        p_level: 1
      });

    if (completionError) {
      console.error('❌ Error checking completion:', completionError);
    } else {
      console.log(`✅ Level completion check: ${isCompleted ? 'Completed' : 'Not completed'}`);
    }

    console.log('\n🎉 Leveling system tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Start your server: cd server && npm start');
    console.log('2. Test the API endpoints in your app');
    console.log('3. Try visiting a location to see the leveling system in action!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testLevelingSystem();
