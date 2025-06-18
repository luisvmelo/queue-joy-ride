-- Fix get_customer_party function to include notified_ready_at field
-- This field is needed for the tolerance timer to work on client screen

DROP FUNCTION IF EXISTS public.get_customer_party(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_customer_party(
  party_uuid UUID, 
  customer_phone TEXT, 
  customer_name TEXT
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  phone TEXT,
  party_size INTEGER,
  queue_position INTEGER,
  initial_position INTEGER,
  estimated_wait_minutes INTEGER,
  tolerance_minutes INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  notified_ready_at TIMESTAMP WITH TIME ZONE,  -- ADD THIS FIELD
  restaurant_id UUID,
  restaurant_name TEXT,
  restaurant_menu_url TEXT,
  restaurant_avg_seat_time_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.phone,
    p.party_size,
    p.queue_position,
    p.initial_position,
    p.estimated_wait_minutes,
    p.tolerance_minutes,
    p.joined_at,
    p.status,
    p.notified_ready_at,  -- ADD THIS FIELD
    p.restaurant_id,
    r.name as restaurant_name,
    r.menu_url as restaurant_menu_url,
    r.avg_seat_time_minutes as restaurant_avg_seat_time_minutes
  FROM parties p
  JOIN restaurants r ON p.restaurant_id = r.id
  WHERE p.id = party_uuid 
    AND p.phone = customer_phone 
    AND LOWER(p.name) = LOWER(customer_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_customer_party TO anon, authenticated;