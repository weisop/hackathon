#!/usr/bin/env node

/**
 * Authentication Flow Test
 * 
 * This script tests the authentication flow to help debug
 * the 401 errors you're seeing.
 * 
 * Usage:
 * node test-auth-flow.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class AuthFlowTester {
  constructor() {
    this.token = null;
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    this.results.push({ timestamp, message, type });
  }

  async testPublicEndpoints() {
    this.log('Testing public endpoints (should work without auth)...');
    
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      this.log('✅ Health endpoint working', 'success');
    } catch (error) {
      this.log(`❌ Health endpoint failed: ${error.message}`, 'error');
    }

    try {
      const itemsResponse = await axios.get(`${BASE_URL}/api/items`);
      this.log('✅ Items endpoint working', 'success');
    } catch (error) {
      this.log(`❌ Items endpoint failed: ${error.message}`, 'error');
    }
  }

  async testProtectedEndpoints() {
    this.log('Testing protected endpoints (should fail without auth)...');
    
    const protectedEndpoints = [
      '/api/location-sessions/active',
      '/api/location-sessions/history',
      '/api/location-sessions/start',
      '/api/friends',
      '/api/location/track'
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        await axios.get(`${BASE_URL}${endpoint}`);
        this.log(`⚠️ ${endpoint} worked without auth (unexpected)`, 'info');
      } catch (error) {
        if (error.response?.status === 401) {
          this.log(`✅ ${endpoint} correctly requires auth (401)`, 'success');
        } else {
          this.log(`❌ ${endpoint} failed with unexpected error: ${error.message}`, 'error');
        }
      }
    }
  }

  async testWithFakeToken() {
    this.log('Testing with fake authentication token...');
    
    const fakeToken = 'fake-jwt-token-for-testing';
    
    try {
      const response = await axios.get(`${BASE_URL}/api/location-sessions/active`, {
        headers: {
          'Authorization': `Bearer ${fakeToken}`
        }
      });
      this.log('⚠️ Fake token worked (unexpected)', 'info');
    } catch (error) {
      if (error.response?.status === 401) {
        this.log('✅ Fake token correctly rejected (401)', 'success');
      } else {
        this.log(`❌ Fake token test failed: ${error.message}`, 'error');
      }
    }
  }

  async checkServerStatus() {
    this.log('Checking if server is running...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/health`);
      this.log('✅ Server is running and responding', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Server is not responding: ${error.message}`, 'error');
      this.log('Make sure to start the server with: cd hackathon/server && npm start', 'info');
      return false;
    }
  }

  async runAllTests() {
    this.log('🔍 Starting Authentication Flow Tests...');
    this.log('=====================================');

    // Test 1: Check if server is running
    const serverRunning = await this.checkServerStatus();
    if (!serverRunning) {
      this.log('❌ Cannot proceed - server is not running', 'error');
      return;
    }
    this.log('');

    // Test 2: Test public endpoints
    await this.testPublicEndpoints();
    this.log('');

    // Test 3: Test protected endpoints (should fail)
    await this.testProtectedEndpoints();
    this.log('');

    // Test 4: Test with fake token
    await this.testWithFakeToken();
    this.log('');

    this.log('=====================================');
    this.log('🎉 Authentication flow tests completed!');
    this.log('');
    this.log('DIAGNOSIS:');
    this.log('The 401 errors are EXPECTED because you need to be logged in.');
    this.log('');
    this.log('SOLUTIONS:');
    this.log('1. Make sure you are logged in to the app');
    this.log('2. Check that authentication is working in the browser');
    this.log('3. Verify the server is using the correct authentication middleware');
    this.log('4. Test the location session features while logged in');
  }
}

// Run the tests
const tester = new AuthFlowTester();
tester.runAllTests().catch(error => {
  console.error('❌ Auth flow tester failed:', error);
  process.exit(1);
});
