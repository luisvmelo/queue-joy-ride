
-- Fix the ambiguous column reference in create_customer_party function
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
  restaurant_avg_time INTEGER;
BEGIN
  -- Validate restaurant exists and is active
  IF NOT EXISTS (SELECT 1 FROM restaurants WHERE id = p_restaurant_id AND is_active = true) THEN
    RAISE EXCEPTION 'Restaurant not found or inactive';
  END IF;

  -- Get restaurant average seat time
  SELECT avg_seat_time_minutes INTO restaurant_avg_time
  FROM restaurants 
  WHERE id = p_restaurant_id;

  -- Calculate queue position (explicitly reference parties table)
  SELECT COALESCE(MAX(parties.queue_position), 0) + 1 INTO new_position
  FROM parties 
  WHERE parties.restaurant_id = p_restaurant_id 
    AND parties.status = 'waiting';

  -- Insert new party
  INSERT INTO parties (
    restaurant_id,
    name,
    phone,
    party_size,
    notification_type,
    status,
    queue_position,
    initial_position,
    estimated_wait_minutes,
    tolerance_minutes
  ) VALUES (
    p_restaurant_id,
    p_name,
    p_phone,
    p_party_size,
    p_notification_type,
    'waiting',
    new_position,
    new_position,
    new_position * COALESCE(restaurant_avg_time, 45),
    COALESCE((SELECT default_tolerance_minutes FROM restaurants WHERE id = p_restaurant_id), 2)
  ) RETURNING id INTO new_party_id;

  RETURN QUERY SELECT new_party_id, new_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
