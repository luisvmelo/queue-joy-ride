
-- Primeiro, vamos dropar a constraint existente que está causando o problema
ALTER TABLE queue_history DROP CONSTRAINT IF EXISTS queue_history_final_status_check;

-- Agora vamos criar uma nova constraint que inclui 'removed' como um status válido
ALTER TABLE queue_history ADD CONSTRAINT queue_history_final_status_check 
  CHECK (final_status IN ('seated', 'no_show', 'removed', 'cancelled'));
