-- Location Levels Database Schema
-- Run this in your Supabase SQL editor

-- 1. Location Levels Table (tracks user progress through levels for each location)
CREATE TABLE IF NOT EXISTS location_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  current_level INTEGER DEFAULT 1,
  total_time_spent_seconds INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, location_id)
);

-- 2. Location Level Requirements Table (defines time requirements for each level)
CREATE TABLE IF NOT EXISTS location_level_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  required_time_hours DECIMAL(8, 3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_id, level)
);

-- 3. Location Level Achievements Table (tracks when users complete levels)
CREATE TABLE IF NOT EXISTS location_level_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  level INTEGER NOT NULL,
  required_time_hours DECIMAL(8, 3) NOT NULL,
  achieved_time_hours DECIMAL(8, 3) NOT NULL,
  achievement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for location_levels
ALTER TABLE location_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own location levels" ON location_levels
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own location levels" ON location_levels
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own location levels" ON location_levels
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for location_level_requirements
ALTER TABLE location_level_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view location level requirements" ON location_level_requirements
  FOR SELECT USING (true);

-- RLS Policies for location_level_achievements
ALTER TABLE location_level_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own level achievements" ON location_level_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own level achievements" ON location_level_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get or create user level for a location
CREATE OR REPLACE FUNCTION get_or_create_user_level(p_user_id UUID, p_location_id TEXT, p_location_name TEXT)
RETURNS location_levels AS $$
DECLARE
  user_level location_levels%ROWTYPE;
BEGIN
  -- Try to get existing level
  SELECT * INTO user_level
  FROM location_levels
  WHERE user_id = p_user_id AND location_id = p_location_id;
  
  -- If not found, create new level
  IF NOT FOUND THEN
    INSERT INTO location_levels (user_id, location_id, location_name, current_level, total_time_spent_seconds, is_unlocked)
    VALUES (p_user_id, p_location_id, p_location_name, 1, 0, true)
    RETURNING * INTO user_level;
  END IF;
  
  RETURN user_level;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate required time for a level (1.5x multiplier)
CREATE OR REPLACE FUNCTION calculate_level_time(base_hours DECIMAL, level INTEGER)
RETURNS DECIMAL AS $$
BEGIN
  RETURN base_hours * POWER(1.5, level - 1);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has completed a level
CREATE OR REPLACE FUNCTION check_level_completion(p_user_id UUID, p_location_id TEXT, p_level INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  user_level location_levels%ROWTYPE;
  required_time DECIMAL;
  base_time DECIMAL := 0.167; -- 10 minutes base time
BEGIN
  -- Get user's current level data
  SELECT * INTO user_level
  FROM location_levels
  WHERE user_id = p_user_id AND location_id = p_location_id;
  
  -- Calculate required time for this level
  required_time := calculate_level_time(base_time, p_level);
  
  -- Check if user has spent enough time
  RETURN (user_level.total_time_spent_seconds / 3600.0) >= required_time;
END;
$$ LANGUAGE plpgsql;

-- Function to advance user to next level
CREATE OR REPLACE FUNCTION advance_to_next_level(p_user_id UUID, p_location_id TEXT, p_location_name TEXT)
RETURNS location_levels AS $$
DECLARE
  user_level location_levels%ROWTYPE;
  new_level INTEGER;
  required_time DECIMAL;
  base_time DECIMAL := 0.167; -- 10 minutes base time
BEGIN
  -- Get current level
  SELECT * INTO user_level
  FROM location_levels
  WHERE user_id = p_user_id AND location_id = p_location_id;
  
  -- Calculate next level
  new_level := user_level.current_level + 1;
  required_time := calculate_level_time(base_time, new_level);
  
  -- Update to next level
  UPDATE location_levels
  SET 
    current_level = new_level,
    total_time_spent_seconds = 0, -- Reset time for new level
    updated_at = NOW()
  WHERE user_id = p_user_id AND location_id = p_location_id
  RETURNING * INTO user_level;
  
  -- Create achievement record
  INSERT INTO location_level_achievements (
    user_id, location_id, location_name, level, 
    required_time_hours, achieved_time_hours, achievement_date
  ) VALUES (
    p_user_id, p_location_id, p_location_name, user_level.current_level - 1,
    calculate_level_time(base_time, user_level.current_level - 1),
    calculate_level_time(base_time, user_level.current_level - 1),
    NOW()
  );
  
  RETURN user_level;
END;
$$ LANGUAGE plpgsql;

-- Insert default level requirements for all locations
INSERT INTO location_level_requirements (location_id, level, required_time_hours)
SELECT 
  id as location_id,
  generate_series(1, 10) as level,
  calculate_level_time(0.167, generate_series(1, 10)) as required_time_hours
FROM (
  SELECT DISTINCT id FROM (
    VALUES 
      ('leon'), ('ugly-mug'), ('allegro'), ('toasted'), ('solstice'),
      ('seven'), ('sunshine'), ('ancient-gate'), ('lune'), ('boon-booma'),
      ('suzallo'), ('odegaard'), ('health-sciences'), ('engineering'), ('foster'),
      ('hub'), ('south-campus'), ('starbucks'), ('cafe-ave'), ('snooze'),
      ('boba-up'), ('dont-yell'), ('hmart'), ('pacha'), ('mr-west'),
      ('zoka'), ('oh-bear'), ('cafe-happy')
  ) AS locations(id)
) AS all_locations
ON CONFLICT (location_id, level) DO NOTHING;
