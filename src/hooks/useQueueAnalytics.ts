
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useQueueAnalytics = (restaurantId: string) => {
  return useQuery({
    queryKey: ['queue-analytics', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_restaurant_analytics', {
        restaurant_uuid: restaurantId
      });

      if (error) {
        console.error('Error fetching analytics:', error);
        throw error;
      }

      return data?.[0] || {
        avg_wait_time_minutes: 0,
        avg_abandonment_time_minutes: 0,
        conversion_rate: 0,
        peak_hours: [],
        return_customer_rate: 0
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePositionWaitTime = (restaurantId: string, position: number) => {
  return useQuery({
    queryKey: ['position-wait-time', restaurantId, position],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_average_wait_time_by_position', {
        restaurant_uuid: restaurantId,
        queue_pos: position
      });

      if (error) {
        console.error('Error fetching position wait time:', error);
        throw error;
      }

      return data || (15 * position); // fallback to 15 minutes per position
    },
    enabled: position > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
