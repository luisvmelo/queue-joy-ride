-- Database Debug Script
-- Execute este script no Supabase SQL Editor para diagnosticar problemas

-- 1. Verificar se as tabelas existem e têm dados
SELECT 'restaurants' as table_name, COUNT(*) as count FROM restaurants
UNION ALL
SELECT 'parties' as table_name, COUNT(*) as count FROM parties
UNION ALL
SELECT 'restaurant_staff' as table_name, COUNT(*) as count FROM restaurant_staff;

-- 2. Verificar se as funções RPC existem
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_customer_party', 'get_restaurant_queue', 'get_user_restaurant_ids');

-- 3. Verificar políticas RLS ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('parties', 'restaurants');

-- 4. Obter um restaurant_id real para teste
SELECT 'Available restaurant IDs:' as info;
SELECT id, name FROM restaurants LIMIT 3;

-- 5. Testar função create_customer_party com um restaurant_id real
-- Descomente a linha abaixo e substitua pelo restaurant_id real da query acima:
-- SELECT * FROM create_customer_party(
--   (SELECT id FROM restaurants LIMIT 1),
--   'Test Customer',
--   '11999999999',
--   2,
--   'sms'
-- );

-- 6. Testar função get_restaurant_queue com um restaurant_id real
-- Descomente a linha abaixo e substitua pelo restaurant_id real:
-- SELECT * FROM get_restaurant_queue((SELECT id FROM restaurants LIMIT 1));

-- 6. Verificar triggers ativos
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('parties', 'restaurants')
AND trigger_schema = 'public';

-- 7. Ver dados atuais das tabelas
SELECT 'Current restaurants:' as info;
SELECT id, name, is_active, owner_id FROM restaurants LIMIT 5;

SELECT 'Current parties:' as info;
SELECT id, name, phone, status, queue_position, restaurant_id FROM parties LIMIT 5;

-- 8. Verificar logs de erro (se disponível)
-- SELECT * FROM pg_stat_activity WHERE state = 'active';

-- 9. Testar RLS permissions
SELECT 'Testing RLS permissions:' as info;
SELECT current_user, session_user;

-- 10. Debug da função específica
SELECT 'Function definitions:' as info;
SELECT p.proname, p.prosrc 
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
AND p.proname IN ('create_customer_party', 'get_restaurant_queue');