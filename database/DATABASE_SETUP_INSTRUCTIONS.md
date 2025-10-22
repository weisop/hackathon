# Database Setup Instructions

This guide will help you set up all required database tables for the location tracking and leveling system.

## Quick Setup (Recommended)

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Complete Setup Script

1. Open the file `setup-all-tables.sql` from this directory
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

This will create all necessary tables, functions, triggers, and security policies in one go.

### Step 3: Verify Setup

Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'location_sessions',
  'location_session_checkpoints',
  'location_achievements',
  'location_levels',
  'location_level_requirements',
  'location_level_achievements'
);
```

You should see all 6 tables listed.

## What Gets Created

### Tables

1. **location_sessions** - Tracks user sessions at locations
2. **location_session_checkpoints** - Detailed tracking of location visits
3. **location_achievements** - Records completed location goals
4. **location_levels** - User progress through levels at each location
5. **location_level_requirements** - Time requirements for each level (1-10)
6. **location_level_achievements** - Records when users complete levels

### Functions

- `update_session_duration()` - Automatically calculates session duration
- `create_achievement_on_completion()` - Creates achievements when targets are met
- `calculate_level_time(base_hours, level)` - Calculates required time for levels
- `get_or_create_user_level()` - Gets or creates user level records

### Security

All tables have Row Level Security (RLS) enabled:
- Users can only view and modify their own data
- Level requirements are publicly readable
- Session checkpoints are linked to user sessions

## Alternative: Individual Setup

If you prefer to set up tables individually, run scripts in this order:

1. `location_sessions_schema.sql` - Basic location tracking
2. `location_levels_schema.sql` - Leveling system

## Troubleshooting

### Error: "relation already exists"

This is safe to ignore - it means the table already exists. The script uses `CREATE TABLE IF NOT EXISTS`.

### Error: "policy already exists"

The script includes `DROP POLICY IF EXISTS` statements, but if you still see this error, manually drop the policies:

```sql
-- List all policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Drop specific policy
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### No data showing in the app

1. Verify tables exist (see Step 3 above)
2. Check if RLS policies are enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
3. Make sure you're authenticated (check browser console for auth token)
4. Check server logs for specific errors

### Server returns empty arrays

This is normal if:
- Tables exist but you haven't visited any locations yet
- You're a new user with no progress
- Server has been updated to return `[]` instead of errors

## Updating Existing Setup

If you already have some tables but want to add missing ones:

1. Run the `setup-all-tables.sql` script - it won't overwrite existing data
2. OR run individual schema files for just the tables you need

## Level Time Formula

Levels use exponential growth: `base_time * 1.5^(level-1)`

- Base time: 10 minutes (0.167 hours)
- Level 1: 10 minutes
- Level 2: 15 minutes
- Level 3: 22.5 minutes
- Level 4: 33.75 minutes
- Level 5: 50.6 minutes
- ...and so on

## Need Help?

Check the server logs for detailed error messages:
- The server now returns empty arrays `[]` instead of errors for missing data
- Console logs show "Error getting achievements:", "Error getting user levels:", etc.
- These indicate database connection or table access issues

