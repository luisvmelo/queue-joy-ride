-- Corrigir função para usar o tempo de tolerância real do restaurante
-- Em vez de 10 minutos fixo, buscar da tabela restaurants

DROP FUNCTION IF EXISTS public.get_restaurant_queue(UUID);

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
        COALESCE(r.tolerance_minutes, 5) as tolerance_minutes -- Buscar do restaurante, padrão 5
    FROM parties p
    LEFT JOIN restaurants r ON p.restaurant_id = r.id
    WHERE p.restaurant_id = restaurant_uuid
    AND p.status IN ('waiting', 'ready')
    ORDER BY COALESCE(p.queue_position, 0) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_restaurant_queue TO anon, authenticated;

-- Verificar se o restaurante tem tolerance_minutes configurado
SELECT 'Verificando tolerance_minutes do restaurante:' as info;
SELECT id, name, tolerance_minutes FROM restaurants;