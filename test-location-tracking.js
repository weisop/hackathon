#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

async function testLocationTracking() {
  console.log('🧪 Testing location tracking functionality...');
  
  const baseURL = process.env.VITE_API_URL || 'http://localhost:3001';
  
  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Server is running:', healthResponse.data);
    
    // Test 2: Test location tracking endpoint (without auth - should get 401)
    console.log('2️⃣ Testing location tracking endpoint (no auth)...');
    try {
      await axios.post(`${baseURL}/api/location/track`, {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint requires authentication (expected)');
      } else {
        console.log('⚠️ Unexpected response:', error.response?.status, error.message);
      }
    }
    
    // Test 3: Test with fake token (should get 401)
    console.log('3️⃣ Testing with fake token...');
    try {
      await axios.post(`${baseURL}/api/location/track`, {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10
      }, {
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Fake token rejected (expected)');
      } else {
        console.log('⚠️ Unexpected response:', error.response?.status, error.message);
      }
    }
    
    console.log('🎉 Location tracking tests completed!');
    console.log('📋 Next steps:');
    console.log('1. Apply the location_tracks schema in Supabase SQL Editor');
    console.log('2. Log in to the app to test with real authentication');
    console.log('3. Check the browser console for location tracking logs');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running: cd server && node server.js');
    }
  }
}

testLocationTracking();
