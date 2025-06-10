
-- Criar tabela para armazenar histórico de tempos por posição
CREATE TABLE public.queue_position_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
  queue_position INTEGER NOT NULL,
  time_to_seat_minutes INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  party_id UUID REFERENCES parties(id) NOT NULL
);

-- Índices para otimizar consultas
CREATE INDEX idx_queue_position_analytics_restaurant_position 
ON queue_position_analytics(restaurant_id, queue_position);

CREATE INDEX idx_queue_position_analytics_recorded_at 
ON queue_position_analytics(recorded_at);

-- Função para calcular tempo médio por posição baseado em histórico
CREATE OR REPLACE FUNCTION public.get_average_wait_time_by_position(
  restaurant_uuid UUID,
  queue_pos INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  avg_time INTEGER;
BEGIN
  -- Calcular média dos últimos 100 registros ou últimos 30 dias, o que for menor
  SELECT COALESCE(AVG(time_to_seat_minutes)::INTEGER, 15 * queue_pos)
  INTO avg_time
  FROM (
    SELECT time_to_seat_minutes
    FROM queue_position_analytics
    WHERE restaurant_id = restaurant_uuid 
    AND queue_position = queue_pos
    AND recorded_at >= NOW() - INTERVAL '30 days'
    ORDER BY recorded_at DESC
    LIMIT 100
  ) recent_data;
  
  -- Se não houver dados históricos, usar estimativa baseada em posição (15 min por posição)
  IF avg_time IS NULL THEN
    avg_time := 15 * queue_pos;
  END IF;
  
  RETURN avg_time;
END;
$$;

-- Função para registrar tempo quando um cliente é atendido
CREATE OR REPLACE FUNCTION public.record_queue_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  wait_time_minutes INTEGER;
BEGIN
  -- Só registrar quando status muda para 'seated'
  IF NEW.status = 'seated' AND OLD.status != 'seated' AND NEW.joined_at IS NOT NULL THEN
    -- Calcular tempo de espera em minutos
    wait_time_minutes := EXTRACT(EPOCH FROM (NEW.seated_at - NEW.joined_at)) / 60;
    
    -- Inserir registro de analytics se temos posição válida
    IF OLD.queue_position IS NOT NULL AND OLD.queue_position > 0 THEN
      INSERT INTO queue_position_analytics (
        restaurant_id,
        queue_position,
        time_to_seat_minutes,
        party_id
      ) VALUES (
        NEW.restaurant_id,
        OLD.queue_position,
        wait_time_minutes,
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para capturar dados automaticamente
CREATE TRIGGER trigger_record_queue_analytics
  AFTER UPDATE ON parties
  FOR EACH ROW
  EXECUTE FUNCTION record_queue_analytics();

-- Função para obter estatísticas gerais do restaurante
CREATE OR REPLACE FUNCTION public.get_restaurant_analytics(restaurant_uuid UUID)
RETURNS TABLE(
  avg_wait_time_minutes NUMERIC,
  avg_abandonment_time_minutes NUMERIC,
  conversion_rate NUMERIC,
  peak_hours JSON,
  return_customer_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH analytics_data AS (
    SELECT 
      AVG(time_to_seat_minutes) as avg_wait,
      COUNT(*) as total_served
    FROM queue_position_analytics qpa
    WHERE qpa.restaurant_id = restaurant_uuid
    AND qpa.recorded_at >= NOW() - INTERVAL '30 days'
  ),
  abandonment_data AS (
    SELECT 
      AVG(EXTRACT(EPOCH FROM (removed_at - joined_at)) / 60) as avg_abandonment
    FROM parties
    WHERE restaurant_id = restaurant_uuid
    AND status = 'no_show'
    AND removed_at >= NOW() - INTERVAL '30 days'
  ),
  conversion_data AS (
    SELECT 
      COUNT(CASE WHEN status = 'seated' THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(*)::NUMERIC, 0) * 100 as conversion
    FROM parties
    WHERE restaurant_id = restaurant_uuid
    AND created_at >= NOW() - INTERVAL '30 days'
  )
  SELECT 
    COALESCE(ad.avg_wait, 0),
    COALESCE(abd.avg_abandonment, 0),
    COALESCE(cd.conversion, 0),
    '[]'::JSON,
    0::NUMERIC
  FROM analytics_data ad
  CROSS JOIN abandonment_data abd  
  CROSS JOIN conversion_data cd;
END;
$$;
