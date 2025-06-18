-- Correção do erro de coluna ambígua
-- Execute este script para corrigir a função create_customer_party

DROP FUNCTION IF EXISTS public.create_customer_party(UUID, TEXT, TEXT, INTEGER, TEXT);

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
  -- Get next position - usar alias para evitar ambiguidade
  SELECT COALESCE(MAX(p.queue_position), 0) + 1 INTO new_pos
  FROM parties p
  WHERE p.restaurant_id = p_restaurant_id AND p.status = 'waiting';
  
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

GRANT EXECUTE ON FUNCTION public.create_customer_party TO anon, authenticated;