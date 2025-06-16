
-- Criar tabelas para suportar as configurações

-- Tabela para eventos
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações avançadas
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  max_queue_size INTEGER DEFAULT 50,
  auto_close_at_limit BOOLEAN DEFAULT false,
  welcome_message TEXT DEFAULT 'Bem-vindo! Você foi adicionado à nossa fila.',
  visible_in_guide BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notification_channels TEXT[] DEFAULT ARRAY['sms']::TEXT[],
  reminder_5min BOOLEAN DEFAULT false,
  peak_alert_staff BOOLEAN DEFAULT true,
  pos_api_key TEXT,
  crm_api_key TEXT,
  webhook_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  favicon_url TEXT,
  google_font TEXT DEFAULT 'Inter',
  require_2fa BOOLEAN DEFAULT false,
  min_password_length INTEGER DEFAULT 8,
  require_uppercase BOOLEAN DEFAULT true,
  require_numbers BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para equipe/staff
CREATE TABLE IF NOT EXISTS public.restaurant_staff_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'receptionist')),
  invite_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de atividade
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para faturas (simulação)
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date DATE NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas faltantes na tabela restaurants
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zipcode TEXT,
ADD COLUMN IF NOT EXISTS max_queue_size INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS opening_time TIME,
ADD COLUMN IF NOT EXISTS closing_time TIME,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic';

-- Inserir configurações padrão para restaurantes existentes
INSERT INTO restaurant_settings (restaurant_id)
SELECT id FROM restaurants 
WHERE id NOT IN (SELECT restaurant_id FROM restaurant_settings WHERE restaurant_id IS NOT NULL)
ON CONFLICT (restaurant_id) DO NOTHING;

-- RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_staff_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

-- Policies para events
CREATE POLICY "Restaurant owners can manage events" ON events
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
  )
);

-- Policies para restaurant_settings
CREATE POLICY "Restaurant owners can manage settings" ON restaurant_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
  )
);

-- Policies para restaurant_staff_invites
CREATE POLICY "Restaurant owners can manage staff invites" ON restaurant_staff_invites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
  )
);

-- Policies para activity_logs
CREATE POLICY "Restaurant owners can view activity logs" ON activity_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
  )
);

-- Policies para billing_invoices
CREATE POLICY "Restaurant owners can view invoices" ON billing_invoices
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM restaurants r 
    WHERE r.id = restaurant_id AND r.owner_id = auth.uid()
  )
);

-- Função para registrar atividades
CREATE OR REPLACE FUNCTION log_activity(
  p_restaurant_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO activity_logs (restaurant_id, user_id, action, details)
  VALUES (p_restaurant_id, auth.uid(), p_action, p_details);
END;
$$;
