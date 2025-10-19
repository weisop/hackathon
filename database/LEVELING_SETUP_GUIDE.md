# Location Leveling System Database Setup Guide

This guide will help you set up the location leveling system in your Supabase database.

## 🎯 What This System Does

- **Progressive Levels**: Each location has multiple levels (1, 2, 3, etc.)
- **Increasing Time Requirements**: Each level requires 1.5x more time than the previous
- **Level 1**: 10 minutes (0.167 hours)
- **Level 2**: 15 minutes (0.25 hours) 
- **Level 3**: 22.5 minutes (0.375 hours)
- **Level 4**: 33.75 minutes (0.563 hours)
- **Level 5**: 50.6 minutes (0.844 hours)
- And so on...

## 📋 Step-by-Step Setup

### 1. Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**

### 2. Apply the Database Schema

Copy and paste the entire contents of `location_levels_schema.sql` into the SQL Editor and run it.

### 3. Verify the Tables Were Created

Run this query to check if the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'location_levels', 
  'location_level_requirements', 
  'location_level_achievements'
);
```

You should see all three tables listed.

### 4. Check Level Requirements Were Populated

Run this query to see the level requirements:

```sql
SELECT location_id, level, required_time_hours 
FROM location_level_requirements 
ORDER BY location_id, level 
LIMIT 20;
```

You should see entries for all your locations with increasing time requirements.

### 5. Test the Functions

Test the level calculation function:

```sql
SELECT 
  level,
  calculate_level_time(0.167, level) as required_hours,
  calculate_level_time(0.167, level) * 60 as required_minutes
FROM generate_series(1, 5) as level;
```

This should show:
- Level 1: 10 minutes
- Level 2: 15 minutes  
- Level 3: 22.5 minutes
- Level 4: 33.75 minutes
- Level 5: 50.6 minutes

## 🔧 Troubleshooting

### If Tables Already Exist

If you get errors about tables already existing, you can drop them first:

```sql
DROP TABLE IF EXISTS location_level_achievements CASCADE;
DROP TABLE IF EXISTS location_level_requirements CASCADE;
DROP TABLE IF EXISTS location_levels CASCADE;
```

Then re-run the schema.

### If Functions Already Exist

If you get errors about functions already existing:

```sql
DROP FUNCTION IF EXISTS get_or_create_user_level(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS calculate_level_time(DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS check_level_completion(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS advance_to_next_level(UUID, TEXT, TEXT);
```

Then re-run the schema.

## 🧪 Testing the System

### Test User Level Creation

```sql
-- This will create a level 1 entry for a test user
SELECT get_or_create_user_level(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'hub',
  'HUB'
);
```

### Test Level Completion Check

```sql
-- This checks if a user has completed level 1 (10 minutes)
SELECT check_level_completion(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'hub',
  1
);
```

### Test Level Advancement

```sql
-- This advances a user to the next level
SELECT advance_to_next_level(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'hub',
  'HUB'
);
```

## 📊 Understanding the Data Structure

### location_levels Table
- Tracks each user's progress for each location
- `current_level`: What level they're currently on
- `total_time_spent_seconds`: Total time spent at this location
- `is_unlocked`: Whether the location is available

### location_level_requirements Table  
- Defines time requirements for each level of each location
- `required_time_hours`: How many hours needed for this level
- Automatically calculated using 1.5x multiplier

### location_level_achievements Table
- Records when users complete levels
- `level`: Which level was completed
- `achieved_time_hours`: How much time was actually spent
- `achievement_date`: When the level was completed

## 🚀 Next Steps

1. **Apply the schema** using the SQL Editor
2. **Test the functions** with the queries above
3. **Start your server** - the API endpoints are ready
4. **Test in the app** - the leveling system should now work!

## 🎮 How It Works in the App

1. **User enters a location** → Level 1 starts (10 minutes required)
2. **User completes Level 1** → Celebration screen appears
3. **User advances to Level 2** → Time resets, 15 minutes required
4. **User completes Level 2** → Celebration screen appears
5. **User advances to Level 3** → Time resets, 22.5 minutes required
6. And so on...

The system automatically tracks time, checks completion, and handles level advancement!
