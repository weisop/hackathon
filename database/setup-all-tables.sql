-- Complete Database Setup for Location Tracking and Leveling System
-- Run this entire script in your Supabase SQL editor to set up all tables
-- This combines location_sessions_schema.sql and location_levels_schema.sql

-- ========================================
-- PART 1: Location Sessions Tables
-- ========================================

-- 1. Location sessions table
CREATE TABLE IF NOT EXISTS location_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  target_hours DECIMAL(8, 3) NOT NULL,
  session_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end_time TIMESTAMP WITH TIME ZONE,
  total_duration_seconds INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Location session checkpoints
CREATE TABLE IF NOT EXISTS location_session_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES location_sessions(id) ON DELETE CASCADE,
  checkpoint_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Location achievements
CREATE TABLE IF NOT EXISTS location_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  target_hours DECIMAL(8, 3) NOT NULL,
  achieved_hours DECIMAL(8, 3) NOT NULL,
  achievement_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_milestone BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PART 2: Location Levels Tables
-- ========================================

-- 4. Location Levels Table
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

-- 5. Location Level Requirements Table
CREATE TABLE IF NOT EXISTS location_level_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  required_time_hours DECIMAL(8, 3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_id, level)
);

-- 6. Location Level Achievements Table
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

-- ========================================
-- PART 3: Indexes
-- ========================================

CREATE INDEX IF NOT EXISTS idx_location_sessions_user_id ON location_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_location_sessions_location_id ON location_sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_location_sessions_active ON location_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_location_sessions_start_time ON location_sessions(session_start_time);
CREATE INDEX IF NOT EXISTS idx_location_session_checkpoints_session_id ON location_session_checkpoints(session_id);
CREATE INDEX IF NOT EXISTS idx_location_achievements_user_id ON location_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_location_achievements_location_id ON location_achievements(location_id);

-- ========================================
-- PART 4: Functions
-- ========================================

-- Function to update session duration
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    NEW.total_duration_seconds = EXTRACT(EPOCH FROM (NEW.session_end_time - NEW.session_start_time));
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create achievement on session completion
CREATE OR REPLACE FUNCTION create_achievement_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_duration_seconds >= (NEW.target_hours * 3600) THEN
    INSERT INTO location_achievements (
      user_id, location_id, location_name, target_hours, 
      achieved_hours, achievement_date, is_milestone
    ) VALUES (
      NEW.user_id, NEW.location_id, NEW.location_name, NEW.target_hours,
      NEW.total_duration_seconds / 3600.0, NEW.session_end_time, true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate level time
CREATE OR REPLACE FUNCTION calculate_level_time(base_hours DECIMAL, level INTEGER)
RETURNS DECIMAL AS $$
BEGIN
  RETURN base_hours * POWER(1.5, level - 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get or create user level
CREATE OR REPLACE FUNCTION get_or_create_user_level(p_user_id UUID, p_location_id TEXT, p_location_name TEXT)
RETURNS location_levels AS $$
DECLARE
  user_level location_levels%ROWTYPE;
BEGIN
  SELECT * INTO user_level
  FROM location_levels
  WHERE user_id = p_user_id AND location_id = p_location_id;
  
  IF NOT FOUND THEN
    INSERT INTO location_levels (user_id, location_id, location_name, current_level, total_time_spent_seconds, is_unlocked)
    VALUES (p_user_id, p_location_id, p_location_name, 1, 0, true)
    RETURNING * INTO user_level;
  END IF;
  
  RETURN user_level;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PART 5: Triggers
-- ========================================

DROP TRIGGER IF EXISTS trigger_update_session_duration ON location_sessions;
CREATE TRIGGER trigger_update_session_duration
  BEFORE UPDATE ON location_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_duration();

DROP TRIGGER IF EXISTS trigger_create_achievement ON location_sessions;
CREATE TRIGGER trigger_create_achievement
  AFTER UPDATE ON location_sessions
  FOR EACH ROW
  WHEN (NEW.is_active = false AND OLD.is_active = true)
  EXECUTE FUNCTION create_achievement_on_completion();

-- ========================================
-- PART 6: Row Level Security (RLS)
-- ========================================

-- Enable RLS
ALTER TABLE location_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_session_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_level_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_level_achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own location sessions" ON location_sessions;
DROP POLICY IF EXISTS "Users can insert own location sessions" ON location_sessions;
DROP POLICY IF EXISTS "Users can update own location sessions" ON location_sessions;
DROP POLICY IF EXISTS "Users can view own session checkpoints" ON location_session_checkpoints;
DROP POLICY IF EXISTS "Users can insert own session checkpoints" ON location_session_checkpoints;
DROP POLICY IF EXISTS "Users can view own achievements" ON location_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON location_achievements;
DROP POLICY IF EXISTS "Users can view their own location levels" ON location_levels;
DROP POLICY IF EXISTS "Users can insert their own location levels" ON location_levels;
DROP POLICY IF EXISTS "Users can update their own location levels" ON location_levels;
DROP POLICY IF EXISTS "Anyone can view location level requirements" ON location_level_requirements;
DROP POLICY IF EXISTS "Users can view their own level achievements" ON location_level_achievements;
DROP POLICY IF EXISTS "Users can insert their own level achievements" ON location_level_achievements;

-- Location Sessions Policies
CREATE POLICY "Users can view own location sessions" ON location_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location sessions" ON location_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location sessions" ON location_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Session Checkpoints Policies
CREATE POLICY "Users can view own session checkpoints" ON location_session_checkpoints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM location_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session checkpoints" ON location_session_checkpoints
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM location_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Achievements Policies
CREATE POLICY "Users can view own achievements" ON location_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON location_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Location Levels Policies
CREATE POLICY "Users can view their own location levels" ON location_levels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location levels" ON location_levels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location levels" ON location_levels
  FOR UPDATE USING (auth.uid() = user_id);

-- Level Requirements Policies
CREATE POLICY "Anyone can view location level requirements" ON location_level_requirements
  FOR SELECT USING (true);

-- Level Achievements Policies
CREATE POLICY "Users can view their own level achievements" ON location_level_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own level achievements" ON location_level_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- PART 7: Initial Data - Level Requirements
-- ========================================

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

-- ========================================
-- VERIFICATION QUERIES (for reference)
-- ========================================
-- After running this script, you can verify the setup with:
-- SELECT * FROM location_level_requirements LIMIT 10;
-- SELECT * FROM location_levels LIMIT 10;
-- SELECT * FROM location_sessions LIMIT 10;

