
-- Phase 1: Fix Critical RLS Policy Issues

-- First, drop all existing dangerous policies that allow unrestricted access
DROP POLICY IF EXISTS "Customers can view their own parties" ON parties;
DROP POLICY IF EXISTS "Authenticated users can create parties" ON parties;
DROP POLICY IF EXISTS "Restaurant staff can update parties" ON parties;
DROP POLICY IF EXISTS "Restaurant owners can manage their restaurants" ON restaurants;
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can view their queue history" ON queue_history;
DROP POLICY IF EXISTS "System can insert queue history" ON queue_history;
DROP POLICY IF EXISTS "Restaurant owners can manage staff" ON restaurant_staff;
DROP POLICY IF EXISTS "Staff can view their own assignments" ON restaurant_staff;

-- Create secure RLS policies for restaurants
CREATE POLICY "Restaurant owners can manage their restaurants" ON restaurants
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM restaurant_staff 
        WHERE restaurant_id = restaurants.id 
        AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view active restaurants" ON restaurants
  FOR SELECT USING (is_active = true);

-- Create secure RLS policies for parties with proper customer verification
CREATE POLICY "Customers can view their own parties" ON parties
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Restaurant staff can see parties for their restaurant
      restaurant_id IN (
        SELECT id FROM restaurants WHERE owner_id = auth.uid()
        UNION
        SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
      )
      -- Note: Customer access by phone/name will be handled in application logic
      -- to avoid RLS recursion issues
    )
  );

CREATE POLICY "Restaurant staff can create parties" ON parties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
      UNION
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant staff can update parties" ON parties
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
      UNION
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant staff can delete parties" ON parties
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
      UNION
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );

-- Create secure RLS policies for queue_history
CREATE POLICY "Restaurant owners can view their queue history" ON queue_history
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
      UNION
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant staff can insert queue history" ON queue_history
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
      UNION
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );

-- Create secure RLS policies for restaurant_staff
CREATE POLICY "Restaurant owners can manage staff" ON restaurant_staff
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );

CREATE POLICY "Staff can view their own assignments" ON restaurant_staff
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Create security definer function for customer party access
CREATE OR REPLACE FUNCTION public.get_customer_party(party_uuid UUID, customer_phone TEXT, customer_name TEXT)
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

-- Create function for public party creation (without auth requirement)
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
BEGIN
  -- Validate restaurant exists and is active
  IF NOT EXISTS (SELECT 1 FROM restaurants WHERE id = p_restaurant_id AND is_active = true) THEN
    RAISE EXCEPTION 'Restaurant not found or inactive';
  END IF;

  -- Calculate queue position
  SELECT COALESCE(MAX(queue_position), 0) + 1 INTO new_position
  FROM parties 
  WHERE restaurant_id = p_restaurant_id 
    AND status = 'waiting';

  -- Insert new party
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

-- Create function for customer party updates (limited scope)
CREATE OR REPLACE FUNCTION public.update_customer_party_status(
  party_uuid UUID,
  customer_phone TEXT,
  new_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow customer to remove themselves from queue
  IF new_status = 'removed' THEN
    UPDATE parties 
    SET 
      status = 'removed',
      removed_at = NOW(),
      updated_at = NOW()
    WHERE id = party_uuid 
      AND phone = customer_phone
      AND status IN ('waiting', 'next', 'ready');
    
    RETURN FOUND;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
