
-- Fix the infinite recursion by properly dropping all existing policies first

-- Drop ALL existing policies on parties table
DROP POLICY IF EXISTS "Restaurant staff can view parties" ON parties;
DROP POLICY IF EXISTS "Restaurant staff can create parties" ON parties;
DROP POLICY IF EXISTS "Restaurant staff can update parties" ON parties;
DROP POLICY IF EXISTS "Restaurant staff can delete parties" ON parties;
DROP POLICY IF EXISTS "Customers can view their own parties" ON parties;
DROP POLICY IF EXISTS "Authenticated users can create parties" ON parties;

-- Drop other problematic policies if they exist
DROP POLICY IF EXISTS "Restaurant owners can manage their restaurants" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can view their queue history" ON queue_history;
DROP POLICY IF EXISTS "Restaurant staff can insert queue history" ON queue_history;
DROP POLICY IF EXISTS "Restaurant owners can manage staff" ON restaurant_staff;

-- Create security definer functions (these are safe to recreate)
CREATE OR REPLACE FUNCTION public.get_user_restaurant_ids()
RETURNS TABLE(restaurant_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT id FROM restaurants WHERE owner_id = auth.uid()
  UNION
  SELECT restaurant_staff.restaurant_id FROM restaurant_staff WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_can_access_restaurant(restaurant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM restaurants WHERE id = restaurant_uuid AND owner_id = auth.uid()
    UNION
    SELECT 1 FROM restaurant_staff WHERE restaurant_id = restaurant_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate all policies using the security definer functions
CREATE POLICY "Restaurant owners can manage their restaurants" ON restaurants
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      owner_id = auth.uid() OR
      id IN (SELECT restaurant_id FROM public.get_user_restaurant_ids())
    )
  );

-- Recreate queue_history policies
CREATE POLICY "Restaurant owners can view their queue history" ON queue_history
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    public.user_can_access_restaurant(restaurant_id)
  );

CREATE POLICY "Restaurant staff can insert queue history" ON queue_history
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    public.user_can_access_restaurant(restaurant_id)
  );

-- Recreate restaurant_staff policies
CREATE POLICY "Restaurant owners can manage staff" ON restaurant_staff
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    public.user_can_access_restaurant(restaurant_id)
  );

-- Recreate parties policies (now properly dropped first)
CREATE POLICY "Restaurant staff can view parties" ON parties
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    public.user_can_access_restaurant(restaurant_id)
  );

CREATE POLICY "Restaurant staff can create parties" ON parties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    public.user_can_access_restaurant(restaurant_id)
  );

CREATE POLICY "Restaurant staff can update parties" ON parties
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    public.user_can_access_restaurant(restaurant_id)
  );

CREATE POLICY "Restaurant staff can delete parties" ON parties
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    public.user_can_access_restaurant(restaurant_id)
  );
