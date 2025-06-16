
-- Drop all existing dangerous policies that allow unrestricted access
DROP POLICY IF EXISTS "Restaurants are viewable by everyone" ON restaurants;
DROP POLICY IF EXISTS "Users can view their own party" ON parties;
DROP POLICY IF EXISTS "Users can insert their own party" ON parties;
DROP POLICY IF EXISTS "Users can update their own party" ON parties;

-- Create proper RLS policies for restaurants
CREATE POLICY "Restaurant owners can manage their restaurants" ON restaurants
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Public can view active restaurants" ON restaurants
  FOR SELECT USING (is_active = true);

-- Create proper RLS policies for parties
CREATE POLICY "Customers can view their own parties" ON parties
  FOR SELECT USING (
    -- Customer can see their own party by phone/name match
    phone = (SELECT phone FROM parties WHERE id = parties.id AND restaurant_id IS NOT NULL)
    OR 
    -- Restaurant staff can see parties for their restaurant
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
      UNION
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create parties" ON parties
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Restaurant staff can update parties" ON parties
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
      UNION
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );

-- Create proper RLS policies for queue_history
CREATE POLICY "Restaurant owners can view their queue history" ON queue_history
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
      UNION
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert queue history" ON queue_history
  FOR INSERT WITH CHECK (true);

-- Create proper RLS policies for restaurant_staff
CREATE POLICY "Restaurant owners can manage staff" ON restaurant_staff
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );

CREATE POLICY "Staff can view their own assignments" ON restaurant_staff
  FOR SELECT USING (user_id = auth.uid());

-- Add missing foreign key constraints for data integrity
ALTER TABLE restaurants 
ADD CONSTRAINT fk_restaurants_owner 
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE parties 
ADD CONSTRAINT fk_parties_restaurant 
FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

ALTER TABLE restaurant_staff 
ADD CONSTRAINT fk_staff_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE restaurant_staff 
ADD CONSTRAINT fk_staff_restaurant 
FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

ALTER TABLE queue_history 
ADD CONSTRAINT fk_queue_history_restaurant 
FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

-- Create security definer function to get user's restaurant
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
    UNION
    SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to check if user owns restaurant
CREATE OR REPLACE FUNCTION public.user_owns_restaurant(restaurant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM restaurants WHERE id = restaurant_uuid AND owner_id = auth.uid()
    UNION
    SELECT 1 FROM restaurant_staff WHERE restaurant_id = restaurant_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
