-- Teste manual de atualização de status
-- Use este script para testar se as atualizações funcionam

-- 1. Ver parties atuais
SELECT 'Parties atuais:' as info;
SELECT id, name, status, queue_position, notified_ready_at 
FROM parties 
WHERE status IN ('waiting', 'ready') 
ORDER BY queue_position;

-- 2. Atualizar manualmente uma party para 'ready' (substitua o ID)
-- Descomente e substitua pelo ID real de uma party com status 'waiting':
/*
UPDATE parties 
SET status = 'ready', 
    notified_ready_at = NOW(),
    updated_at = NOW()
WHERE id = 'SEU_PARTY_ID_AQUI'
RETURNING id, name, status, notified_ready_at;
*/

-- 3. Verificar se a atualização foi feita
SELECT 'Parties após atualização:' as info;
SELECT id, name, status, queue_position, notified_ready_at 
FROM parties 
WHERE status IN ('waiting', 'ready') 
ORDER BY queue_position;

-- 4. Ver se há triggers ativos que possam estar interferindo
SELECT 'Triggers ativos:' as info;
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'parties'
AND trigger_schema = 'public';

-- 5. Verificar permissões na tabela parties
SELECT 'Permissões na tabela parties:' as info;
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'parties'
AND table_schema = 'public';