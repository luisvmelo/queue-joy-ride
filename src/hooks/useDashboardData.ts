
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QueueParty {
  party_id: string;
  name: string;
  phone: string;
  party_size: number;
  status: string;
  queue_position: number;
  joined_at: string;
  notified_ready_at: string | null;
  tolerance_minutes: number;
}

interface Restaurant {
  id: string;
  name: string;
  is_active: boolean;
  avg_seat_time_minutes: number | null;
}

interface Stats {
  totalInQueue: number;
  avgWaitTime: number;
  servedToday: number;
  nextInLine: QueueParty | null;
}

export const useDashboardData = (restaurantId: string | null, user: any) => {
  const { toast } = useToast();
  const [queueData, setQueueData] = useState<QueueParty[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalInQueue: 0,
    avgWaitTime: 0,
    servedToday: 0,
    nextInLine: null
  });

  // Função para executar remoção automática de no-shows
  const runAutoRemoveNoShow = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('auto-remove-no-show');
      if (error) {
        console.error('Erro ao executar auto-remove-no-show:', error);
      } else if (data?.processed > 0) {
        console.log(`Auto-remove executado: ${data.processed} clientes removidos`);
        fetchQueueData(); // Atualizar dados após remoção
      }
    } catch (error) {
      console.error('Erro na execução do auto-remove:', error);
    }
  };

  useEffect(() => {
    if (restaurantId && user) {
      fetchRestaurantData();
      fetchQueueData();
      
      const channel = supabase
        .channel('receptionist-queue-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'parties',
            filter: `restaurant_id=eq.${restaurantId}`
          },
          () => {
            fetchQueueData();
          }
        )
        .subscribe();

      // Executar auto-remove a cada 30 segundos
      const autoRemoveInterval = setInterval(() => {
        runAutoRemoveNoShow();
      }, 30000);

      // Executar uma vez imediatamente
      runAutoRemoveNoShow();

      return () => {
        supabase.removeChannel(channel);
        clearInterval(autoRemoveInterval);
      };
    }
  }, [restaurantId, user]);

  const fetchRestaurantData = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (error) throw error;
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar dados do restaurante",
        variant: "destructive"
      });
    }
  };

  const fetchQueueData = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase.rpc('get_restaurant_queue', {
        restaurant_uuid: restaurantId
      });

      if (error) throw error;
      
      const queueParties = (data || []) as QueueParty[];
      setQueueData(queueParties);

      const waitingParties = queueParties.filter(p => p.status === 'waiting');
      const readyParties = queueParties.filter(p => p.status === 'ready');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Buscar dados do histórico para estatísticas mais precisas
      const { count: servedCount } = await supabase
        .from('queue_history')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('final_status', 'seated')
        .gte('created_at', today.toISOString());

      setStats({
        totalInQueue: waitingParties.length + readyParties.length,
        avgWaitTime: restaurant?.avg_seat_time_minutes || 45,
        servedToday: servedCount || 0,
        nextInLine: waitingParties.sort((a, b) => a.queue_position - b.queue_position)[0] || null
      });

    } catch (error) {
      console.error('Error fetching queue:', error);
      toast({
        title: "Erro ao carregar fila",
        description: "Não foi possível carregar os dados da fila",
        variant: "destructive"
      });
    }
  };

  return { queueData, restaurant, stats, fetchQueueData };
};
