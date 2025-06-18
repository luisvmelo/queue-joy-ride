-- Fix: Uncomment and create missing get_restaurant_queue function
-- This function is required by the dashboard to fetch queue data

-- DEBUGGING QUERIES (run these in Supabase SQL Editor to test):
-- 1. Check if parties exist:
--    SELECT * FROM parties LIMIT 10;
-- 
-- 2. Check if restaurants exist and get IDs:
--    SELECT id, name, owner_id FROM restaurants;
--
-- 3. Test the get_restaurant_queue function (replace with actual restaurant_id):
--    SELECT * FROM get_restaurant_queue('YOUR_RESTAURANT_ID_HERE');
--
-- 4. Test get_user_restaurant_ids function:
--    SELECT * FROM get_user_restaurant_ids();

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
    -- Add logging for debugging
    RAISE NOTICE 'get_restaurant_queue called with restaurant_id: %', restaurant_uuid;
    
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
    AND p.status IN ('waiting', 'next', 'ready')  -- Include all relevant statuses
    ORDER BY p.queue_position ASC;
    
    -- Log the result count
    GET DIAGNOSTICS 
    party_id = ROW_COUNT;
    RAISE NOTICE 'get_restaurant_queue returning % rows', party_id;
END;
$$ LANGUAGE plpgsql;

-- Also ensure the trigger function for queue position updates is working
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate positions for all waiting parties when status changes
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

-- Ensure the trigger is attached to the parties table
DROP TRIGGER IF EXISTS update_queue_positions_trigger ON parties;
CREATE TRIGGER update_queue_positions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON parties
    FOR EACH ROW
    EXECUTE FUNCTION update_queue_positions();