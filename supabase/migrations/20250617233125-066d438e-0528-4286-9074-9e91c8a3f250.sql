
-- Verificar qual constraint está causando o problema
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'parties'::regclass 
AND contype = 'c' 
AND conname LIKE '%notification_type%';

-- Remover a constraint existente se ela existir
ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_notification_type_check;

-- Criar uma nova constraint que permite os valores corretos incluindo 'manual'
ALTER TABLE parties ADD CONSTRAINT parties_notification_type_check 
CHECK (notification_type IN ('sms', 'whatsapp', 'email', 'manual', 'phone'));
