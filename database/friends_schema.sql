-- Friends System Database Schema
-- Run this in your Supabase SQL editor

-- 1. Friends relationships table
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 2. Location tracking table
CREATE TABLE IF NOT EXISTS location_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  altitude DECIMAL(8, 2),
  heading DECIMAL(5, 2),
  speed DECIMAL(8, 2),
  enhanced_data JSONB, -- Store Google Maps data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Location sharing permissions table
CREATE TABLE IF NOT EXISTS location_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  can_see_location BOOLEAN DEFAULT false,
  can_see_history BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional: temporary sharing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 4. Friend location notifications table
CREATE TABLE IF NOT EXISTS location_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('friend_nearby', 'location_shared', 'location_updated')),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_location_tracks_user_id ON location_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_location_tracks_created_at ON location_tracks(created_at);
CREATE INDEX IF NOT EXISTS idx_location_sharing_user_id ON location_sharing(user_id);
CREATE INDEX IF NOT EXISTS idx_location_sharing_friend_id ON location_sharing(friend_id);
CREATE INDEX IF NOT EXISTS idx_location_notifications_user_id ON location_notifications(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friends table
CREATE POLICY "Users can view their own friends" ON friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friend requests" ON friends
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for location_tracks table
CREATE POLICY "Users can view their own locations" ON location_tracks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations" ON location_tracks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for location_sharing table
CREATE POLICY "Users can view their own sharing settings" ON location_sharing
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their own sharing settings" ON location_sharing
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for location_notifications table
CREATE POLICY "Users can view their own notifications" ON location_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications for themselves" ON location_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on friends table
CREATE TRIGGER update_friends_updated_at 
  BEFORE UPDATE ON friends 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get friends with their latest location
CREATE OR REPLACE FUNCTION get_friends_with_locations(user_uuid UUID)
RETURNS TABLE (
  friend_id UUID,
  friend_name TEXT,
  friend_email TEXT,
  latest_latitude DECIMAL(10, 8),
  latest_longitude DECIMAL(11, 8),
  latest_accuracy DECIMAL(8, 2),
  latest_enhanced_data JSONB,
  location_updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.friend_id,
    p.full_name as friend_name,
    p.email as friend_email,
    lt.latitude as latest_latitude,
    lt.longitude as latest_longitude,
    lt.accuracy as latest_accuracy,
    lt.enhanced_data as latest_enhanced_data,
    lt.created_at as location_updated_at
  FROM friends f
  JOIN profiles p ON f.friend_id = p.id
  LEFT JOIN location_tracks lt ON f.friend_id = lt.user_id
  LEFT JOIN location_sharing ls ON f.user_id = ls.user_id AND f.friend_id = ls.friend_id
  WHERE f.user_id = user_uuid 
    AND f.status = 'accepted'
    AND (ls.can_see_location = true OR ls.can_see_location IS NULL)
  ORDER BY lt.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if users are nearby (within specified distance)
CREATE OR REPLACE FUNCTION check_nearby_friends(
  user_uuid UUID,
  user_lat DECIMAL(10, 8),
  user_lng DECIMAL(11, 8),
  distance_meters INTEGER DEFAULT 1000
)
RETURNS TABLE (
  friend_id UUID,
  friend_name TEXT,
  distance_meters DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.friend_id,
    p.full_name as friend_name,
    (6371000 * acos(
      cos(radians(user_lat)) * 
      cos(radians(lt.latitude)) * 
      cos(radians(lt.longitude) - radians(user_lng)) + 
      sin(radians(user_lat)) * 
      sin(radians(lt.latitude))
    )) as distance_meters
  FROM friends f
  JOIN profiles p ON f.friend_id = p.id
  JOIN location_tracks lt ON f.friend_id = lt.user_id
  JOIN location_sharing ls ON f.user_id = ls.user_id AND f.friend_id = ls.friend_id
  WHERE f.user_id = user_uuid 
    AND f.status = 'accepted'
    AND ls.can_see_location = true
    AND lt.created_at > NOW() - INTERVAL '1 hour' -- Only recent locations
    AND (6371000 * acos(
      cos(radians(user_lat)) * 
      cos(radians(lt.latitude)) * 
      cos(radians(lt.longitude) - radians(user_lng)) + 
      sin(radians(user_lat)) * 
      sin(radians(lt.latitude))
    )) <= distance_meters
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



