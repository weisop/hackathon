-- Create location_tracks table for location tracking
CREATE TABLE IF NOT EXISTS location_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  enhanced_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_location_tracks_user_id ON location_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_location_tracks_created_at ON location_tracks(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE location_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_tracks table
CREATE POLICY "Users can view their own locations" ON location_tracks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations" ON location_tracks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON location_tracks TO authenticated;
GRANT ALL ON location_tracks TO service_role;
