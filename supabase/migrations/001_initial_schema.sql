
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Restaurants table
CREATE TABLE restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  menu_url TEXT,
  tolerance_minutes INTEGER DEFAULT 5,
  avg_seat_time_minutes INTEGER DEFAULT 45,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parties (waitlist entries) table
CREATE TABLE parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('sms', 'call', 'push', 'email')),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'next', 'ready', 'seated', 'removed', 'no_show')),
  queue_position INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_next_at TIMESTAMP WITH TIME ZONE,
  notified_ready_at TIMESTAMP WITH TIME ZONE,
  seated_at TIMESTAMP WITH TIME ZONE,
  removed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically update queue positions
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate positions for all waiting parties at this restaurant
  WITH ranked_parties AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY joined_at) as new_position
    FROM parties 
    WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id)
    AND status = 'waiting'
  )
  UPDATE parties 
  SET queue_position = ranked_parties.new_position,
      updated_at = NOW()
  FROM ranked_parties 
  WHERE parties.id = ranked_parties.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update positions when parties change
CREATE TRIGGER trigger_update_queue_positions
  AFTER INSERT OR UPDATE OR DELETE ON parties
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_positions();

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Restaurants are readable by everyone
CREATE POLICY "Restaurants are viewable by everyone" ON restaurants
  FOR SELECT USING (true);

-- Parties can only be seen by the person who created them (using session)
CREATE POLICY "Users can view their own party" ON parties
  FOR SELECT USING (true); -- We'll handle this in the app logic

CREATE POLICY "Users can insert their own party" ON parties
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own party" ON parties
  FOR UPDATE USING (true);

-- Seed data
INSERT INTO restaurants (id, name, menu_url, tolerance_minutes, avg_seat_time_minutes) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  'The Cozy Corner',
  'https://example.com/menu',
  5,
  45
);
