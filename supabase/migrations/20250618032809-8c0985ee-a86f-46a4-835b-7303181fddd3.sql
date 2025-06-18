
-- Adicionar campos necessários para informações completas do restaurante
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS detailed_opening_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "22:00", "closed": false},
  "tuesday": {"open": "09:00", "close": "22:00", "closed": false},
  "wednesday": {"open": "09:00", "close": "22:00", "closed": false},
  "thursday": {"open": "09:00", "close": "22:00", "closed": false},
  "friday": {"open": "09:00", "close": "22:00", "closed": false},
  "saturday": {"open": "09:00", "close": "22:00", "closed": false},
  "sunday": {"open": "09:00", "close": "22:00", "closed": false}
}'::jsonb;

-- Atualizar restaurantes existentes com dados de exemplo
UPDATE restaurants 
SET 
  phone = COALESCE(phone, '+55 11 99999-9999'),
  instagram_url = COALESCE(instagram_url, 'https://instagram.com/restaurante_exemplo'),
  detailed_opening_hours = COALESCE(detailed_opening_hours, '{
    "monday": {"open": "18:00", "close": "02:00", "closed": false},
    "tuesday": {"open": "18:00", "close": "02:00", "closed": false},
    "wednesday": {"open": "18:00", "close": "02:00", "closed": false},
    "thursday": {"open": "18:00", "close": "02:00", "closed": false},
    "friday": {"open": "18:00", "close": "03:00", "closed": false},
    "saturday": {"open": "18:00", "close": "03:00", "closed": false},
    "sunday": {"open": "18:00", "close": "01:00", "closed": false}
  }'::jsonb)
WHERE phone IS NULL OR instagram_url IS NULL OR detailed_opening_hours IS NULL;
