-- Ultra-simplified functions that should work without any issues
-- These remove all potential sources of errors

-- Drop existing functions
DROP FUNCTION IF EXISTS public.create_customer_party(UUID, TEXT, TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.get_restaurant_queue(UUID);

-- Create ultra-simple create_customer_party
CREATE OR REPLACE FUNCTION public.create_customer_party(
  p_restaurant_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_party_size INTEGER,
  p_notification_type TEXT DEFAULT 'sms'
)
RETURNS TABLE(party_id UUID, queue_position INTEGER) AS $$
DECLARE
  new_id UUID := gen_random_uuid();
  new_pos INTEGER := 1;
BEGIN
  -- Get next position
  SELECT COALESCE(MAX(queue_position), 0) + 1 INTO new_pos
  FROM parties 
  WHERE restaurant_id = p_restaurant_id AND status = 'waiting';
  
  -- Insert party
  INSERT INTO parties (
    id, restaurant_id, name, phone, party_size, 
    queue_position, status, notification_type, 
    joined_at, created_at, updated_at
  ) VALUES (
    new_id, p_restaurant_id, p_name, p_phone, p_party_size,
    new_pos, 'waiting', p_notification_type,
    NOW(), NOW(), NOW()
  );
  
  RETURN QUERY SELECT new_id, new_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create ultra-simple get_restaurant_queue
CREATE OR REPLACE FUNCTION public.get_restaurant_queue(restaurant_uuid UUID)
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
        COALESCE(p.queue_position, 0),
        p.joined_at,
        p.notified_ready_at,
        10 as tolerance_minutes -- Fixed value for now
    FROM parties p
    WHERE p.restaurant_id = restaurant_uuid
    AND p.status IN ('waiting', 'ready')
    ORDER BY COALESCE(p.queue_position, 0) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_customer_party TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_restaurant_queue TO anon, authenticated;

-- Create a simple test function
CREATE OR REPLACE FUNCTION public.test_database_connection()
RETURNS TEXT AS $$
BEGIN
  RETURN 'Database connection working at ' || NOW()::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.test_database_connection TO anon, authenticated;