-- Super League Auction - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  host_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'retention', 'auction', 'complete')),
  auction_state JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room players table
CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  team_id VARCHAR(20) CHECK (team_id IN ('real-madrid', 'barcelona', 'bayern', NULL)),
  is_host BOOLEAN DEFAULT FALSE,
  is_ready BOOLEAN DEFAULT FALSE,
  is_connected BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, team_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_user_id ON room_players(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms table
-- Allow anyone to read rooms
CREATE POLICY "Rooms are viewable by everyone" ON rooms
  FOR SELECT USING (true);

-- Allow anyone to insert rooms (anonymous users can create rooms)
CREATE POLICY "Anyone can create a room" ON rooms
  FOR INSERT WITH CHECK (true);

-- Allow updates to rooms (for status and auction_state changes)
CREATE POLICY "Anyone can update rooms" ON rooms
  FOR UPDATE USING (true);

-- RLS Policies for room_players table
-- Allow anyone to read room players
CREATE POLICY "Room players are viewable by everyone" ON room_players
  FOR SELECT USING (true);

-- Allow anyone to insert room players
CREATE POLICY "Anyone can join a room" ON room_players
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update room players
CREATE POLICY "Anyone can update room players" ON room_players
  FOR UPDATE USING (true);

-- Allow anyone to delete room players
CREATE POLICY "Anyone can leave a room" ON room_players
  FOR DELETE USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on rooms table
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cleanup old rooms (optional - run this as a scheduled job)
-- DELETE FROM rooms WHERE created_at < NOW() - INTERVAL '24 hours' AND status != 'complete';
