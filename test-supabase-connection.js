#!/usr/bin/env node

/**
 * Test Supabase Connection
 * 
 * This script tests the Supabase connection and table access
 * to help debug the 500 error.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🧪 Testing basic connection...');
    
    // Test 1: Basic connection
    const { data: health, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Basic connection failed:', healthError.message);
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    // Test 2: Check if location_sessions table exists
    console.log('\n🧪 Testing location_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('location_sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.error('❌ location_sessions table error:', sessionsError.message);
      console.error('Details:', sessionsError);
      return;
    }
    
    console.log('✅ location_sessions table accessible');
    
    // Test 3: Test insert (with fake data)
    console.log('\n🧪 Testing session insert...');
    const testSession = {
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      location_id: 'test-location',
      location_name: 'Test Location',
      latitude: 47.6062,
      longitude: -122.3321,
      target_hours: 1.0,
      session_start_time: new Date().toISOString(),
      is_active: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('location_sessions')
      .insert(testSession)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      console.error('Details:', insertError);
      return;
    }
    
    console.log('✅ Insert successful, ID:', insertData.id);
    
    // Clean up test data
    await supabase
      .from('location_sessions')
      .delete()
      .eq('id', insertData.id);
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All tests passed! Supabase connection is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConnection();
