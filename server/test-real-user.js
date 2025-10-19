#!/usr/bin/env node

/**
 * Test with Real User ID
 * 
 * This script gets the actual user ID from the JWT token
 * and tests session creation with the real user.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWithRealUser() {
  try {
    console.log('🔍 Testing with real user authentication...');
    
    // Get all users from auth.users to see what's available
    console.log('\n🧪 Checking auth.users table...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Failed to get users:', usersError.message);
      return;
    }
    
    console.log(`✅ Found ${users.users.length} users in auth.users`);
    
    if (users.users.length > 0) {
      const user = users.users[0];
      console.log('👤 First user:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
      
      // Test session creation with real user ID
      console.log('\n🧪 Testing session creation with real user...');
      const testSession = {
        user_id: user.id, // Use real user ID
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
      console.log('\n🎉 Session creation works with real user ID!');
      
    } else {
      console.log('❌ No users found in auth.users table');
      console.log('This means you need to log in to the app first to create a user record');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testWithRealUser();
