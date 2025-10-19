-- Location Sessions Database Schema
-- Tracks how long users have been at specific locations
-- Run this in your Supabase SQL editor

-- 1. Location sessions table
CREATE TABLE IF NOT EXISTS location_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL, -- ID of the location (e.g., 'hub', 'suzallo')
  location_name TEXT NOT NULL, -- Human-readable name (e.g., 'HUB', 'Suzallo Library')
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  target_hours DECIMAL(8, 3) NOT NULL, -- Target duration in hours
  session_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end_time TIMESTAMP WITH TIME ZONE, -- NULL if session is still active
  total_duration_seconds INTEGER DEFAULT 0, -- Total time spent at this location
  is_active BOOLEAN DEFAULT true, -- Whether the session is currently active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Location session checkpoints (for detailed tracking)
CREATE TABLE IF NOT EXISTS location_session_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES location_sessions(id) ON DELETE CASCADE,
  checkpoint_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER NOT NULL, -- Duration since session start
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Location achievements (for completed sessions)
CREATE TABLE IF NOT EXISTS location_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  target_hours DECIMAL(8, 3) NOT NULL,
  achieved_hours DECIMAL(8, 3) NOT NULL,
  achievement_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_milestone BOOLEAN DEFAULT false, -- e.g., first time reaching target
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_location_sessions_user_id ON location_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_location_sessions_location_id ON location_sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_location_sessions_active ON location_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_location_sessions_start_time ON location_sessions(session_start_time);
CREATE INDEX IF NOT EXISTS idx_location_session_checkpoints_session_id ON location_session_checkpoints(session_id);
CREATE INDEX IF NOT EXISTS idx_location_achievements_user_id ON location_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_location_achievements_location_id ON location_achievements(location_id);

-- 5. Function to update session duration
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the total duration when session ends
  IF NEW.is_active = false AND OLD.is_active = true THEN
    NEW.total_duration_seconds = EXTRACT(EPOCH FROM (NEW.session_end_time - NEW.session_start_time));
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to automatically update session duration
CREATE TRIGGER trigger_update_session_duration
  BEFORE UPDATE ON location_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_duration();

-- 7. Function to create achievement when target is reached
CREATE OR REPLACE FUNCTION create_achievement_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if session reached or exceeded target
  IF NEW.total_duration_seconds >= (NEW.target_hours * 3600) THEN
    INSERT INTO location_achievements (
      user_id, 
      location_id, 
      location_name, 
      target_hours, 
      achieved_hours,
      achievement_date,
      is_milestone
    ) VALUES (
      NEW.user_id,
      NEW.location_id,
      NEW.location_name,
      NEW.target_hours,
      NEW.total_duration_seconds / 3600.0,
      NEW.session_end_time,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger to create achievements
CREATE TRIGGER trigger_create_achievement
  AFTER UPDATE ON location_sessions
  FOR EACH ROW
  WHEN (NEW.is_active = false AND OLD.is_active = true)
  EXECUTE FUNCTION create_achievement_on_completion();

-- 9. Row Level Security (RLS) policies
ALTER TABLE location_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_session_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_achievements ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own location sessions" ON location_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location sessions" ON location_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location sessions" ON location_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Similar policies for checkpoints
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

-- Similar policies for achievements
CREATE POLICY "Users can view own achievements" ON location_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON location_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
