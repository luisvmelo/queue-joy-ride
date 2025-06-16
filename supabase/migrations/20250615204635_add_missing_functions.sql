-- Arquivo: supabase/migrations/[TIMESTAMP]_add_missing_functions.sql
-- Execute este arquivo para criar as funções RPC ausentes

-- Função para chamar próximo da fila
CREATE OR REPLACE FUNCTION call_next_in_queue(p_restaurant_id UUID)
RETURNS TABLE (
    party_id UUID,
    name TEXT,
    phone TEXT,
    party_size INTEGER
) AS $$
DECLARE
    next_party RECORD;
BEGIN
    -- Buscar próximo da fila
    SELECT * INTO next_party
    FROM parties 
    WHERE restaurant_id = p_restaurant_id 
    AND status = 'waiting'
    ORDER BY queue_position ASC
    LIMIT 1;
    
    IF next_party.id IS NOT NULL THEN
        -- Atualizar status para ready
        UPDATE parties 
        SET 
            status = 'ready',
            notified_ready_at = NOW(),
            updated_at = NOW()
        WHERE id = next_party.id;
        
        -- Retornar dados do party
        RETURN QUERY
        SELECT 
            next_party.id,
            next_party.name,
            next_party.phone,
            next_party.party_size;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Função handle_no_show (alias para mark_party_no_show)
CREATE OR REPLACE FUNCTION handle_no_show(p_party_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN mark_party_no_show(p_party_id);
END;
$$ LANGUAGE plpgsql;

-- Função para corrigir o parâmetro da confirm_party_arrival se necessário
-- (Caso a função exista mas com parâmetro diferente)
DROP FUNCTION IF EXISTS confirm_party_arrival(UUID);
CREATE OR REPLACE FUNCTION confirm_party_arrival(party_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE parties 
    SET 
        status = 'seated',
        arrived_at = NOW(),
        confirmed_by_receptionist = TRUE,
        seated_at = NOW(),
        updated_at = NOW()
    WHERE id = party_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- View para substituir restaurant_live_stats (se necessário)
CREATE OR REPLACE VIEW restaurant_live_stats AS
SELECT 
    r.*,
    COALESCE(p.queue_size, 0) as queue_size,
    COALESCE(p.min_wait_time, 0) as min_wait_time
FROM restaurants r
LEFT JOIN (
    SELECT 
        restaurant_id,
        COUNT(*) FILTER (WHERE status IN ('waiting', 'next', 'ready')) as queue_size,
        MIN(queue_position * COALESCE(
            (SELECT avg_seat_time_minutes FROM restaurants WHERE id = restaurant_id), 
            45
        )) as min_wait_time
    FROM parties
    WHERE status IN ('waiting', 'next', 'ready')
    GROUP BY restaurant_id
) p ON r.id = p.restaurant_id;