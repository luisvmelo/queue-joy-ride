-- Teste completo das funções para identificar o problema
-- Execute este script linha por linha no Supabase SQL Editor

-- 1. Verificar se temos restaurantes disponíveis
SELECT 'Restaurantes disponíveis:' as info;
SELECT id, name, is_active, owner_id FROM restaurants;

-- 2. Testar a função create_customer_party diretamente
-- IMPORTANTE: Substitua o UUID abaixo por um ID real da query acima
DO $$
DECLARE
    test_restaurant_id UUID;
    result_record RECORD;
BEGIN
    -- Pegar o primeiro restaurante disponível
    SELECT id INTO test_restaurant_id FROM restaurants WHERE is_active = true LIMIT 1;
    
    IF test_restaurant_id IS NULL THEN
        RAISE NOTICE 'ERRO: Nenhum restaurante ativo encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testando com restaurant_id: %', test_restaurant_id;
    
    -- Testar a função
    BEGIN
        FOR result_record IN 
            SELECT * FROM create_customer_party(
                test_restaurant_id,
                'Cliente Teste',
                '11999999999',
                2,
                'sms'
            )
        LOOP
            RAISE NOTICE 'SUCESSO - Party criado: ID=%, Position=%', 
                result_record.party_id, result_record.queue_position;
        END LOOP;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERRO na create_customer_party: % - %', SQLSTATE, SQLERRM;
    END;
END $$;

-- 3. Testar a função get_restaurant_queue
DO $$
DECLARE
    test_restaurant_id UUID;
    result_record RECORD;
    counter INTEGER := 0;
BEGIN
    -- Pegar o primeiro restaurante disponível
    SELECT id INTO test_restaurant_id FROM restaurants WHERE is_active = true LIMIT 1;
    
    IF test_restaurant_id IS NULL THEN
        RAISE NOTICE 'ERRO: Nenhum restaurante ativo encontrado!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testando get_restaurant_queue com restaurant_id: %', test_restaurant_id;
    
    -- Testar a função
    BEGIN
        FOR result_record IN 
            SELECT * FROM get_restaurant_queue(test_restaurant_id)
        LOOP
            counter := counter + 1;
            RAISE NOTICE 'Party %: % (%) - Status: %, Position: %', 
                counter, result_record.name, result_record.phone, 
                result_record.status, result_record.queue_position;
        END LOOP;
        
        RAISE NOTICE 'SUCESSO - get_restaurant_queue retornou % registros', counter;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERRO na get_restaurant_queue: % - %', SQLSTATE, SQLERRM;
    END;
END $$;

-- 4. Verificar se as policies estão bloqueando acesso
SELECT 'Policies ativas na tabela parties:' as info;
SELECT policyname, cmd, permissive, roles FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'parties';

SELECT 'Policies ativas na tabela restaurants:' as info;
SELECT policyname, cmd, permissive, roles FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'restaurants';

-- 5. Verificar o usuário atual e permissões
SELECT 'Usuário atual:' as info;
SELECT current_user, session_user;

-- 6. Testar acesso direto às tabelas (para verificar RLS)
SELECT 'Teste de acesso direto às tabelas:' as info;
SELECT 'parties count' as table_name, COUNT(*) as accessible_rows FROM parties;
SELECT 'restaurants count' as table_name, COUNT(*) as accessible_rows FROM restaurants;

-- 7. Verificar se RLS está habilitado
SELECT 'RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('parties', 'restaurants');

-- 8. Teste final: inserção manual simples
SELECT 'Teste de inserção manual:' as info;
DO $$
DECLARE
    test_restaurant_id UUID;
    new_party_id UUID;
BEGIN
    SELECT id INTO test_restaurant_id FROM restaurants LIMIT 1;
    new_party_id := gen_random_uuid();
    
    INSERT INTO parties (
        id, restaurant_id, name, phone, party_size, 
        queue_position, status, joined_at, created_at, updated_at
    ) VALUES (
        new_party_id, test_restaurant_id, 'Teste Manual', '11888888888', 1,
        999, 'waiting', NOW(), NOW(), NOW()
    );
    
    RAISE NOTICE 'SUCESSO - Inserção manual criou party: %', new_party_id;
    
    -- Limpar o teste
    DELETE FROM parties WHERE id = new_party_id;
    RAISE NOTICE 'Party de teste removido';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRO na inserção manual: % - %', SQLSTATE, SQLERRM;
END $$;