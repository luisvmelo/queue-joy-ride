-- Temporarily disable RLS to fix immediate issues
-- This can be re-enabled later with proper policies

-- Disable RLS on parties table temporarily
ALTER TABLE parties DISABLE ROW LEVEL SECURITY;

-- Disable RLS on restaurants table temporarily  
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow all authenticated access to parties" ON parties;
DROP POLICY IF EXISTS "Allow authenticated restaurant access" ON restaurants;
DROP POLICY IF EXISTS "Restaurant staff can view parties" ON parties;
DROP POLICY IF EXISTS "Restaurant staff can create parties" ON parties;
DROP POLICY IF EXISTS "Restaurant staff can update parties" ON parties;
DROP POLICY IF EXISTS "Restaurant staff can delete parties" ON parties;
DROP POLICY IF EXISTS "Customers can view their own parties" ON parties;
DROP POLICY IF EXISTS "Authenticated users can create parties" ON parties;
DROP POLICY IF EXISTS "Restaurant owners can manage their restaurants" ON restaurants;

-- Grant necessary permissions to anon users (for QR code access)
GRANT SELECT, INSERT, UPDATE ON parties TO anon;
GRANT SELECT ON restaurants TO anon;

-- Grant all permissions to authenticated users
GRANT ALL ON parties TO authenticated;
GRANT ALL ON restaurants TO authenticated;

-- Ensure the functions can be called by anon users (for QR code check-ins)
GRANT EXECUTE ON FUNCTION create_customer_party TO anon;
GRANT EXECUTE ON FUNCTION get_restaurant_queue TO anon;
GRANT EXECUTE ON FUNCTION get_user_restaurant_ids TO anon;

-- Add a note about re-enabling RLS later
COMMENT ON TABLE parties IS 'RLS temporarily disabled - re-enable with proper policies later';
COMMENT ON TABLE restaurants IS 'RLS temporarily disabled - re-enable with proper policies later';