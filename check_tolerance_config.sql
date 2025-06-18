-- Verificar configuração de tolerância do restaurante

-- 1. Verificar se a coluna tolerance_minutes existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
AND column_name = 'tolerance_minutes';

-- 2. Ver valores atuais de tolerance_minutes
SELECT 'Configuração atual dos restaurantes:' as info;
SELECT id, name, tolerance_minutes FROM restaurants;

-- 3. Se o campo não existir ou estiver NULL, configurar com 5 minutos
UPDATE restaurants 
SET tolerance_minutes = 5 
WHERE tolerance_minutes IS NULL OR tolerance_minutes = 0;

-- 4. Verificar após atualização
SELECT 'Após configurar 5 minutos padrão:' as info;
SELECT id, name, tolerance_minutes FROM restaurants;

-- 5. Testar a função com o valor real
SELECT 'Teste da função com tolerance_minutes real:' as info;
SELECT party_id, name, status, tolerance_minutes 
FROM get_restaurant_queue((SELECT id FROM restaurants LIMIT 1));