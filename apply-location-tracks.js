#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function applyLocationTracksSchema() {
  console.log('🔧 Applying location_tracks schema to Supabase...');
  
  // Get Supabase configuration
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    console.log('Please ensure you have VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in your .env file');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Read the SQL schema
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'database', 'apply-location-tracks.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing location_tracks schema...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('⚠️ RPC method failed, trying direct execution...');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          if (stmtError) {
            console.warn(`⚠️ Statement failed: ${stmtError.message}`);
          }
        }
      }
    }
    
    // Test if table exists
    console.log('🧪 Testing if location_tracks table exists...');
    const { data: testData, error: testError } = await supabase
      .from('location_tracks')
      .select('*')
      .limit(1);
    
    if (testError) {
      if (testError.code === 'PGRST116') {
        console.log('❌ location_tracks table does not exist');
        console.log('📋 Please apply the schema manually in Supabase SQL Editor:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of database/apply-location-tracks.sql');
        console.log('4. Execute the SQL');
      } else {
        console.error('❌ Error testing table:', testError);
      }
    } else {
      console.log('✅ location_tracks table exists and is accessible');
    }
    
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    console.log('📋 Please apply the schema manually in Supabase SQL Editor:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of database/apply-location-tracks.sql');
    console.log('4. Execute the SQL');
  }
}

applyLocationTracksSchema();
