
-- Final fix for stack depth limit exceeded error
-- This completely rewrites the create_customer_party function to avoid any recursion

-- First drop the existing function
DROP FUNCTION IF EXISTS public.create_customer_party(UUID, TEXT, TEXT, INTEGER, TEXT);

-- Create a much simpler version that avoids any potential recursion
CREATE OR REPLACE FUNCTION public.create_customer_party(
  p_restaurant_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_party_size INTEGER,
  p_notification_type TEXT DEFAULT 'sms'
)
RETURNS TABLE(party_id UUID, queue_position INTEGER) AS $$
DECLARE
  new_party_id UUID;
  new_position INTEGER;
  restaurant_exists BOOLEAN;
BEGIN
  -- Simple existence check without complex queries
  SELECT EXISTS(
    SELECT 1 FROM restaurants 
    WHERE id = p_restaurant_id AND is_active = true
  ) INTO restaurant_exists;
  
  IF NOT restaurant_exists THEN
    RAISE EXCEPTION 'Restaurant not found or inactive';
  END IF;

  -- Calculate position with a simple subquery
  new_position := COALESCE(
    (SELECT MAX(queue_position) + 1 
     FROM parties 
     WHERE restaurant_id = p_restaurant_id 
       AND status = 'waiting'), 
    1
  );

  -- Insert the party with minimal data
  INSERT INTO parties (
    restaurant_id,
    name,
    phone,
    party_size,
    notification_type,
    status,
    queue_position,
    initial_position
  ) VALUES (
    p_restaurant_id,
    p_name,
    p_phone,
    p_party_size,
    p_notification_type,
    'waiting',
    new_position,
    new_position
  ) RETURNING id INTO new_party_id;

  RETURN QUERY SELECT new_party_id, new_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure we have a simple policy for customer party creation
-- Drop and recreate a simpler policy that allows any authenticated user to create parties
DROP POLICY IF EXISTS "Allow party creation for customers" ON parties;

CREATE POLICY "Allow party creation for customers" ON parties
  FOR INSERT WITH CHECK (true);
