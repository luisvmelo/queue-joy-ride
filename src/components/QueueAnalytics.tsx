
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Clock, Users, Activity } from "lucide-react";

interface QueueAnalytics {
  totalServedToday: number;
  avgWaitTimeToday: number;
  maxWaitTimeToday: number;
  minWaitTimeToday: number;
  currentQueueSize: number;
  peakHours: { hour: number; count: number }[];
}

interface QueueAnalyticsProps {
  restaurantId: string;
}

const QueueAnalytics = ({ restaurantId }: QueueAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<QueueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [restaurantId]);

  const loadAnalytics = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      // Get current queue size
      const { count: queueSize } = await supabase
        .from('parties')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .in('status', ['waiting', 'next', 'ready']);

      // Get today's served parties from queue_history
      const { data: servedData } = await supabase
        .from('queue_history')
        .select('wait_time_minutes, joined_at')
        .eq('restaurant_id', restaurantId)
        .eq('final_status', 'seated')
        .gte('created_at', todayIso);

      // Calculate analytics from served data
      const totalServed = servedData?.length || 0;
      const waitTimes = servedData?.map(entry => entry.wait_time_minutes).filter(Boolean) || [];
      
      const avgWaitTime = waitTimes.length > 0 
        ? Math.round(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length)
        : 0;
      const maxWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
      const minWaitTime = waitTimes.length > 0 ? Math.min(...waitTimes) : 0;

      // Get peak hours from today's queue_history
      const { data: peakData } = await supabase
        .from('queue_history')
        .select('joined_at')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', todayIso);

      // Process peak hours
      const hourCounts: { [key: number]: number } = {};
      if (peakData) {
        peakData.forEach(entry => {
          if (entry.joined_at) {
            const hour = new Date(entry.joined_at).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
          }
        });
      }

      const peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setAnalytics({
        totalServedToday: totalServed,
        avgWaitTimeToday: avgWaitTime,
        maxWaitTimeToday: maxWaitTime,
        minWaitTimeToday: minWaitTime,
        currentQueueSize: queueSize || 0,
        peakHours
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Análise do Dia</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendidos Hoje</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalServedToday}</div>
            <p className="text-xs text-muted-foreground">clientes atendidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgWaitTimeToday || 0}min</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.minWaitTimeToday > 0 && (
                <>
                  <span>Mín: {analytics.minWaitTimeToday}min</span>
                  <span className="mx-2">•</span>
                  <span>Máx: {analytics.maxWaitTimeToday}min</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fila Atual</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.currentQueueSize}</div>
            <p className="text-xs text-muted-foreground">pessoas aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horários de Pico</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analytics.peakHours.length > 0 ? (
              <div className="space-y-1">
                {analytics.peakHours.map((peak, index) => (
                  <div key={index} className="text-xs">
                    <span className="font-medium">{peak.hour}:00:</span>{' '}
                    <span className="text-muted-foreground">{peak.count} entradas</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sem dados ainda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QueueAnalytics;
