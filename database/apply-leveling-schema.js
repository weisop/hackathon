#!/usr/bin/env node

/**
 * Apply Location Leveling Schema to Supabase
 * 
 * This script helps you apply the leveling system database schema.
 * Run this from the hackathon directory: node database/apply-leveling-schema.js
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 Location Leveling System Database Setup');
console.log('==========================================\n');

// Read the schema file
const schemaPath = path.join(__dirname, 'location_levels_schema.sql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

console.log('📋 Database Schema to Apply:');
console.log('----------------------------');
console.log('✅ Tables to create:');
console.log('   • location_levels (user progress tracking)');
console.log('   • location_level_requirements (level time requirements)');
console.log('   • location_level_achievements (level completion records)');
console.log('\n✅ Functions to create:');
console.log('   • get_or_create_user_level()');
console.log('   • calculate_level_time()');
console.log('   • check_level_completion()');
console.log('   • advance_to_next_level()');
console.log('\n✅ RLS Policies to create:');
console.log('   • User can only access their own data');
console.log('   • Public access to level requirements');

console.log('\n📝 Next Steps:');
console.log('===============');
console.log('1. Open your Supabase project dashboard');
console.log('2. Go to SQL Editor');
console.log('3. Copy and paste the schema from: database/location_levels_schema.sql');
console.log('4. Click "Run" to execute the schema');
console.log('5. Verify tables were created successfully');

console.log('\n🔍 Verification Queries:');
console.log('========================');
console.log('Run these in Supabase SQL Editor to verify:');
console.log('');
console.log('-- Check tables exist');
console.log("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('location_levels', 'location_level_requirements', 'location_level_achievements');");
console.log('');
console.log('-- Check level requirements');
console.log('SELECT location_id, level, required_time_hours FROM location_level_requirements ORDER BY location_id, level LIMIT 10;');
console.log('');
console.log('-- Test level calculation');
console.log('SELECT level, calculate_level_time(0.167, level) as required_hours FROM generate_series(1, 5) as level;');

console.log('\n🎮 Level Progression:');
console.log('=====================');
console.log('Level 1: 10 minutes  (0.167 hours)');
console.log('Level 2: 15 minutes  (0.25 hours)');
console.log('Level 3: 22.5 minutes (0.375 hours)');
console.log('Level 4: 33.75 minutes (0.563 hours)');
console.log('Level 5: 50.6 minutes (0.844 hours)');
console.log('...and so on (1.5x multiplier each level)');

console.log('\n✨ Ready to apply the schema!');
console.log('Open database/location_levels_schema.sql and copy it to Supabase SQL Editor.');
