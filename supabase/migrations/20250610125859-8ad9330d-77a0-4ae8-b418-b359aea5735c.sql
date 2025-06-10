
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  menu_url TEXT,
  tolerance_minutes INTEGER DEFAULT 5,
  avg_seat_time_minutes INTEGER DEFAULT 45,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parties (waitlist entries) table
CREATE TABLE IF NOT EXISTS parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('sms', 'whatsapp', 'call', 'push', 'email')),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'next', 'ready', 'seated', 'removed', 'no_show')),
  queue_position INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_next_at TIMESTAMP WITH TIME ZONE,
  notified_ready_at TIMESTAMP WITH TIME ZONE,
  seated_at TIMESTAMP WITH TIME ZONE,
  removed_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  confirmed_by_receptionist BOOLEAN DEFAULT FALSE,
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
DROP TRIGGER IF EXISTS trigger_update_queue_positions ON parties;
CREATE TRIGGER trigger_update_queue_positions
  AFTER INSERT OR UPDATE OR DELETE ON parties
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_positions();

-- Create a function to get the current queue for a restaurant
CREATE OR REPLACE FUNCTION get_restaurant_queue(restaurant_uuid UUID)
RETURNS TABLE (
    party_id UUID,
    name TEXT,
    phone TEXT,
    party_size INTEGER,
    status TEXT,
    queue_position INTEGER,
    joined_at TIMESTAMP WITH TIME ZONE,
    notified_ready_at TIMESTAMP WITH TIME ZONE,
    tolerance_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.phone,
        p.party_size,
        p.status,
        p.queue_position,
        p.joined_at,
        p.notified_ready_at,
        r.tolerance_minutes
    FROM parties p
    JOIN restaurants r ON p.restaurant_id = r.id
    WHERE p.restaurant_id = restaurant_uuid
    AND p.status IN ('waiting', 'next', 'ready')
    ORDER BY p.queue_position ASC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to confirm party arrival
CREATE OR REPLACE FUNCTION confirm_party_arrival(party_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE parties 
    SET 
        status = 'seated',
        arrived_at = NOW(),
        confirmed_by_receptionist = TRUE,
        seated_at = NOW(),
        updated_at = NOW()
    WHERE id = party_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to mark party as no-show
CREATE OR REPLACE FUNCTION mark_party_no_show(party_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE parties 
    SET 
        status = 'no_show',
        removed_at = NOW(),
        updated_at = NOW()
    WHERE id = party_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to move party to next position (for no-shows who want to rejoin)
CREATE OR REPLACE FUNCTION move_party_to_next_position(party_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    restaurant_uuid UUID;
    new_position INTEGER;
BEGIN
    -- Get the restaurant and calculate new position
    SELECT restaurant_id INTO restaurant_uuid FROM parties WHERE id = party_uuid;
    
    SELECT COALESCE(MAX(queue_position), 0) + 1 
    INTO new_position 
    FROM parties 
    WHERE restaurant_id = restaurant_uuid AND status = 'waiting';
    
    UPDATE parties 
    SET 
        status = 'waiting',
        queue_position = new_position,
        removed_at = NULL,
        updated_at = NOW()
    WHERE id = party_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Restaurants are readable by everyone
CREATE POLICY "Restaurants are viewable by everyone" ON restaurants
  FOR SELECT USING (true);

-- Parties can be seen by everyone (for receptionist access)
CREATE POLICY "Users can view parties" ON parties
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own party" ON parties
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update parties" ON parties
  FOR UPDATE USING (true);

-- Enable realtime for parties table
ALTER TABLE parties REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE parties;

-- Seed data
INSERT INTO restaurants (id, name, menu_url, tolerance_minutes, avg_seat_time_minutes) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  'O Cantinho Aconchegante',
  'https://example.com/menu',
  2,
  45
) ON CONFLICT (id) DO NOTHING;
