
-- Criar enum para tipos de usuário
CREATE TYPE user_type AS ENUM ('owner', 'admin', 'receptionist');

-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  user_type user_type NOT NULL DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campos ao restaurante para vinculá-lo ao dono
ALTER TABLE public.restaurants 
ADD COLUMN owner_id UUID REFERENCES public.profiles(id),
ADD COLUMN description TEXT,
ADD COLUMN address TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN email TEXT,
ADD COLUMN website TEXT,
ADD COLUMN opening_hours JSONB,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Criar tabela para gerenciar acesso de funcionários aos restaurantes
CREATE TABLE public.restaurant_staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'receptionist')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas RLS para restaurant_staff
CREATE POLICY "Staff can view their restaurant assignments" ON public.restaurant_staff
  FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE id = auth.uid()));

-- Políticas RLS para restaurants (atualizar as existentes)
DROP POLICY IF EXISTS "Restaurants are viewable by everyone" ON public.restaurants;

CREATE POLICY "Restaurants are viewable by everyone" ON public.restaurants
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage their restaurants" ON public.restaurants
  FOR ALL USING (owner_id IN (SELECT id FROM public.profiles WHERE id = auth.uid()));

-- Função para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'owner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
