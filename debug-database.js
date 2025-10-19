#!/usr/bin/env node

/**
 * Database Debugging Tool
 * 
 * This script helps debug database connection and schema issues
 * for the location sessions system.
 * 
 * Usage:
 * node debug-database.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Required environment variables:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class DatabaseDebugger {
  constructor() {
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    this.results.push({ timestamp, message, type });
  }

  async testConnection() {
    this.log('Testing Supabase connection...');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        this.log(`Connection failed: ${error.message}`, 'error');
        return false;
      }
      
      this.log('✅ Database connection successful', 'success');
      return true;
    } catch (error) {
      this.log(`Connection error: ${error.message}`, 'error');
      return false;
    }
  }

  async checkTables() {
    this.log('Checking if location session tables exist...');
    
    const tables = [
      'location_sessions',
      'location_session_checkpoints', 
      'location_achievements'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          this.log(`❌ Table '${table}' does not exist or has issues: ${error.message}`, 'error');
        } else {
          this.log(`✅ Table '${table}' exists and is accessible`, 'success');
        }
      } catch (error) {
        this.log(`❌ Error checking table '${table}': ${error.message}`, 'error');
      }
    }
  }

  async testLocationSessionInsert() {
    this.log('Testing location session insert...');
    
    try {
      const testSession = {
        user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        location_id: 'test-location',
        location_name: 'Test Location',
        latitude: 47.6062,
        longitude: -122.3321,
        target_hours: 4.0,
        session_start_time: new Date().toISOString(),
        is_active: true
      };

      const { data, error } = await supabase
        .from('location_sessions')
        .insert(testSession)
        .select()
        .single();

      if (error) {
        this.log(`❌ Insert failed: ${error.message}`, 'error');
        this.log(`Error details: ${JSON.stringify(error, null, 2)}`, 'error');
        return false;
      }

      this.log('✅ Test session inserted successfully', 'success');
      this.log(`Session ID: ${data.id}`, 'info');

      // Clean up test data
      await supabase
        .from('location_sessions')
        .delete()
        .eq('id', data.id);

      this.log('✅ Test session cleaned up', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Insert test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async checkRLSPolicies() {
    this.log('Checking RLS policies...');
    
    try {
      // Try to query with service role (should work)
      const { data: serviceData, error: serviceError } = await supabase
        .from('location_sessions')
        .select('*')
        .limit(1);

      if (serviceError) {
        this.log(`❌ Service role query failed: ${serviceError.message}`, 'error');
      } else {
        this.log('✅ Service role access working', 'success');
      }

      // Try to query with anon key (should be restricted)
      const anonSupabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
      const { data: anonData, error: anonError } = await anonSupabase
        .from('location_sessions')
        .select('*')
        .limit(1);

      if (anonError) {
        this.log(`⚠️ Anon key access restricted (expected): ${anonError.message}`, 'info');
      } else {
        this.log('⚠️ Anon key has access (may be unexpected)', 'info');
      }

    } catch (error) {
      this.log(`❌ RLS check failed: ${error.message}`, 'error');
    }
  }

  async checkEnvironmentVariables() {
    this.log('Checking environment variables...');
    
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        this.log(`❌ Missing: ${varName}`, 'error');
      } else {
        this.log(`✅ Found: ${varName} (${value.substring(0, 20)}...)`, 'success');
      }
    }
  }

  async runAllTests() {
    this.log('🔍 Starting Database Debugging...');
    this.log('=====================================');

    // Test 1: Environment Variables
    await this.checkEnvironmentVariables();
    this.log('');

    // Test 2: Database Connection
    const connectionOk = await this.testConnection();
    if (!connectionOk) {
      this.log('❌ Cannot proceed - database connection failed', 'error');
      return;
    }
    this.log('');

    // Test 3: Check Tables
    await this.checkTables();
    this.log('');

    // Test 4: Test Insert
    await this.testLocationSessionInsert();
    this.log('');

    // Test 5: Check RLS
    await this.checkRLSPolicies();
    this.log('');

    this.log('=====================================');
    this.log('🎉 Database debugging completed!');
    this.log('');
    this.log('Next Steps:');
    this.log('1. If tables are missing, run the SQL schema');
    this.log('2. If RLS is blocking, check your policies');
    this.log('3. If inserts fail, check your data types');
    this.log('4. Check server logs for API errors');
  }
}

// Run the debugger
const debugger = new DatabaseDebugger();
debugger.runAllTests().catch(error => {
  console.error('❌ Debugger failed:', error);
  process.exit(1);
});
