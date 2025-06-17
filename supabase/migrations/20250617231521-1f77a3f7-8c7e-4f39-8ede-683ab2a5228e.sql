
-- Primeiro, vamos remover completamente a constraint de chave estrangeira existente
ALTER TABLE queue_history DROP CONSTRAINT IF EXISTS queue_history_party_id_fkey;

-- Limpar registros órfãos que podem estar causando problemas
DELETE FROM queue_history 
WHERE party_id IS NOT NULL 
AND party_id NOT IN (SELECT id FROM parties);

-- Mover dados históricos para queue_history SEM manter party_id (evitando referência circular)
INSERT INTO queue_history (
  restaurant_id,
  name,
  phone,
  party_size,
  queue_position,
  joined_at,
  called_at,
  seated_at,
  cancelled_at,
  final_status,
  wait_time_minutes
)
SELECT 
  p.restaurant_id,
  p.name,
  p.phone,
  p.party_size,
  COALESCE(p.queue_position, p.initial_position, 1),
  p.joined_at,
  p.notified_ready_at,
  p.seated_at,
  p.removed_at,
  CASE 
    WHEN p.status = 'seated' THEN 'seated'
    WHEN p.status = 'no_show' THEN 'no_show'
    WHEN p.status = 'removed' THEN 'cancelled'
    ELSE p.status
  END,
  CASE 
    WHEN p.seated_at IS NOT NULL AND p.joined_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (p.seated_at - p.joined_at))/60
    ELSE NULL
  END
FROM parties p
WHERE p.status IN ('seated', 'no_show', 'removed');

-- Agora podemos remover os registros finalizados da tabela parties
DELETE FROM parties 
WHERE status IN ('seated', 'no_show', 'removed');

-- Recriar a constraint de chave estrangeira com ON DELETE SET NULL
ALTER TABLE queue_history 
ADD CONSTRAINT queue_history_party_id_fkey 
FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE SET NULL;

-- Criar função para mover party para histórico quando finalizado
CREATE OR REPLACE FUNCTION move_party_to_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou para um estado final, mover para histórico
  IF NEW.status IN ('seated', 'no_show', 'removed') AND OLD.status NOT IN ('seated', 'no_show', 'removed') THEN
    
    -- Inserir no histórico SEM party_id para evitar problemas de referência
    INSERT INTO queue_history (
      restaurant_id,
      name,
      phone,
      party_size,
      queue_position,
      joined_at,
      called_at,
      seated_at,
      cancelled_at,
      final_status,
      wait_time_minutes
    ) VALUES (
      NEW.restaurant_id,
      NEW.name,
      NEW.phone,
      NEW.party_size,
      COALESCE(NEW.queue_position, NEW.initial_position, 1),
      NEW.joined_at,
      NEW.notified_ready_at,
      CASE WHEN NEW.status = 'seated' THEN NEW.seated_at ELSE NULL END,
      CASE WHEN NEW.status IN ('no_show', 'removed') THEN NOW() ELSE NULL END,
      NEW.status,
      CASE 
        WHEN NEW.seated_at IS NOT NULL AND NEW.joined_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (NEW.seated_at - NEW.joined_at))/60
        ELSE NULL
      END
    );
    
    -- Remover da fila ativa
    DELETE FROM parties WHERE id = NEW.id;
    
    -- Reordenar posições da fila
    WITH ranked_parties AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY joined_at) as new_position
      FROM parties 
      WHERE restaurant_id = NEW.restaurant_id
      AND status = 'waiting'
    )
    UPDATE parties 
    SET queue_position = ranked_parties.new_position,
        updated_at = NOW()
    FROM ranked_parties 
    WHERE parties.id = ranked_parties.id;
    
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para mover automaticamente para histórico
DROP TRIGGER IF EXISTS trigger_move_to_history ON parties;
CREATE TRIGGER trigger_move_to_history
  AFTER UPDATE ON parties
  FOR EACH ROW
  EXECUTE FUNCTION move_party_to_history();

-- Atualizar função confirm_party_arrival
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função mark_party_no_show
CREATE OR REPLACE FUNCTION mark_party_no_show(party_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE parties 
    SET 
        status = 'no_show',
        removed_at = NOW(),
        updated_at = NOW()
    WHERE id = party_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
