
-- Inserir os restaurantes fictícios na tabela restaurants
INSERT INTO public.restaurants (id, name, menu_url, tolerance_minutes, avg_seat_time_minutes) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  'O Cantinho Aconchegante',
  'https://exemplo.com/menu-cantinho',
  10,
  45
),
(
  '550e8400-e29b-41d4-a716-446655440001', 
  'Pizzaria do Bairro',
  'https://exemplo.com/menu-pizzaria',
  15,
  40
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Burger Palace', 
  'https://exemplo.com/menu-burger',
  12,
  35
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Sushi Express',
  'https://exemplo.com/menu-sushi',
  8,
  50
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Bar da Esquina',
  'https://exemplo.com/menu-bar-esquina',
  20,
  30
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'Boteco do João',
  'https://exemplo.com/menu-boteco',
  25,
  35
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  menu_url = EXCLUDED.menu_url,
  tolerance_minutes = EXCLUDED.tolerance_minutes,
  avg_seat_time_minutes = EXCLUDED.avg_seat_time_minutes;
