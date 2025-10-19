#!/usr/bin/env node

/**
 * Friends System Test Script
 * 
 * This script helps you test the friends system by making API calls
 * and verifying the responses.
 * 
 * Usage:
 * node test-friends-system.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_USERS = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
  { email: 'test3@example.com', password: 'password123' }
];

class FriendsSystemTester {
  constructor() {
    this.tokens = {};
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async makeRequest(method, endpoint, data = null, token = null) {
    try {
      const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  async testServerHealth() {
    this.log('Testing server health...');
    const result = await this.makeRequest('GET', '/api/health');
    
    if (result.success) {
      this.log('✅ Server is running and healthy', 'success');
      return true;
    } else {
      this.log(`❌ Server health check failed: ${result.error}`, 'error');
      return false;
    }
  }

  async testAuthentication() {
    this.log('Testing authentication...');
    
    for (let i = 0; i < TEST_USERS.length; i++) {
      const user = TEST_USERS[i];
      this.log(`Testing auth for ${user.email}...`);
      
      // Note: This assumes you have a sign-in endpoint
      // You might need to adjust this based on your actual auth setup
      const result = await this.makeRequest('POST', '/api/auth/signin', {
        email: user.email,
        password: user.password
      });

      if (result.success && result.data.token) {
        this.tokens[user.email] = result.data.token;
        this.log(`✅ Authentication successful for ${user.email}`, 'success');
      } else {
        this.log(`❌ Authentication failed for ${user.email}: ${result.error}`, 'error');
      }
    }
  }

  async testFriendsAPI() {
    this.log('Testing Friends API endpoints...');
    
    const testUser = TEST_USERS[0].email;
    const token = this.tokens[testUser];
    
    if (!token) {
      this.log('❌ No authentication token available', 'error');
      return;
    }

    // Test 1: Get friends
    this.log('Testing GET /api/friends...');
    const friendsResult = await this.makeRequest('GET', '/api/friends', null, token);
    if (friendsResult.success) {
      this.log(`✅ Friends API working - Found ${friendsResult.data.length} friends`, 'success');
    } else {
      this.log(`❌ Friends API failed: ${friendsResult.error}`, 'error');
    }

    // Test 2: Get friend requests
    this.log('Testing GET /api/friends/requests...');
    const requestsResult = await this.makeRequest('GET', '/api/friends/requests', null, token);
    if (requestsResult.success) {
      this.log(`✅ Friend requests API working - Found ${requestsResult.data.length} pending requests`, 'success');
    } else {
      this.log(`❌ Friend requests API failed: ${requestsResult.error}`, 'error');
    }

    // Test 3: Send friend request
    this.log('Testing POST /api/friends/request...');
    const friendEmail = TEST_USERS[1].email;
    const requestResult = await this.makeRequest('POST', '/api/friends/request', {
      friendEmail: friendEmail
    }, token);
    
    if (requestResult.success) {
      this.log(`✅ Friend request sent successfully to ${friendEmail}`, 'success');
    } else {
      this.log(`❌ Friend request failed: ${requestResult.error}`, 'error');
    }
  }

  async testLocationAPI() {
    this.log('Testing Location API endpoints...');
    
    const testUser = TEST_USERS[0].email;
    const token = this.tokens[testUser];
    
    if (!token) {
      this.log('❌ No authentication token available', 'error');
      return;
    }

    // Test location tracking
    this.log('Testing POST /api/location/track...');
    const locationData = {
      latitude: 47.6062,
      longitude: -122.3321,
      accuracy: 10,
      timestamp: new Date().toISOString()
    };

    const locationResult = await this.makeRequest('POST', '/api/location/track', locationData, token);
    
    if (locationResult.success) {
      this.log('✅ Location tracking API working', 'success');
    } else {
      this.log(`❌ Location tracking API failed: ${locationResult.error}`, 'error');
    }

    // Test friend locations
    this.log('Testing GET /api/friends/locations...');
    const friendLocationsResult = await this.makeRequest('GET', '/api/friends/locations', null, token);
    
    if (friendLocationsResult.success) {
      this.log(`✅ Friend locations API working - Found ${friendLocationsResult.data.length} friend locations`, 'success');
    } else {
      this.log(`❌ Friend locations API failed: ${friendLocationsResult.error}`, 'error');
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Friends System Tests...');
    this.log('=====================================');

    // Test 1: Server Health
    const serverHealthy = await this.testServerHealth();
    if (!serverHealthy) {
      this.log('❌ Server is not running. Please start the server first.', 'error');
      return;
    }

    // Test 2: Authentication
    await this.testAuthentication();

    // Test 3: Friends API
    await this.testFriendsAPI();

    // Test 4: Location API
    await this.testLocationAPI();

    this.log('=====================================');
    this.log('🎉 Friends System Tests Completed!');
    this.log('');
    this.log('Next Steps:');
    this.log('1. Open your app in the browser');
    this.log('2. Click "🔧 Debug Friends" button');
    this.log('3. Run the interactive tests');
    this.log('4. Check the browser console for detailed logs');
  }
}

// Run the tests
const tester = new FriendsSystemTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
