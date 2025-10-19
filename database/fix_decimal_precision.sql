-- Fix Decimal Precision for Time Fields
-- Run this in your Supabase SQL Editor to fix the numeric field overflow error

-- Update location_sessions table
ALTER TABLE location_sessions 
ALTER COLUMN target_hours TYPE DECIMAL(8, 3);

-- Update location_achievements table  
ALTER TABLE location_achievements 
ALTER COLUMN target_hours TYPE DECIMAL(8, 3),
ALTER COLUMN achieved_hours TYPE DECIMAL(8, 3);

-- Update location_level_requirements table (if it exists)
ALTER TABLE location_level_requirements 
ALTER COLUMN required_time_hours TYPE DECIMAL(8, 3);

-- Update location_level_achievements table (if it exists)
ALTER TABLE location_level_achievements 
ALTER COLUMN required_time_hours TYPE DECIMAL(8, 3),
ALTER COLUMN achieved_time_hours TYPE DECIMAL(8, 3);

-- Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type, 
  numeric_precision, 
  numeric_scale
FROM information_schema.columns 
WHERE table_name IN (
  'location_sessions', 
  'location_achievements', 
  'location_level_requirements', 
  'location_level_achievements'
) 
AND column_name LIKE '%hours%'
ORDER BY table_name, column_name;
