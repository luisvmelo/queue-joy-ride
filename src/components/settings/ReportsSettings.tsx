
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, TrendingUp } from "lucide-react";

interface ReportsSettingsProps {
  restaurantId: string;
}

const ReportsSettings = ({ restaurantId }: ReportsSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avgTimeToday, setAvgTimeToday] = useState<number | null>(null);

  const exportTodayData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from("queue_history")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString());

      if (error) throw error;

      // Convert to CSV
      const headers = ["Nome", "Telefone", "Pessoas", "Posição", "Entrou em", "Status", "Tempo de Espera (min)"];
      const csvContent = [
        headers.join(","),
        ...data.map(record => [
          record.name,
          record.phone,
          record.party_size,
          record.queue_position,
          new Date(record.joined_at).toLocaleString("pt-BR"),
          record.final_status,
          record.wait_time_minutes || 0
        ].join(","))
      ].join("\n");

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `fila_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgTimeToday = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("queue_history")
        .select("wait_time_minutes")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", today.toISOString())
        .not("wait_time_minutes", "is", null);

      if (error) throw error;

      if (data.length > 0) {
        const avg = data.reduce((sum, record) => sum + record.wait_time_minutes, 0) / data.length;
        setAvgTimeToday(Math.round(avg));
      } else {
        setAvgTimeToday(0);
      }
    } catch (error) {
      console.error("Error calculating average time:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Relatórios e Exportação</h3>
        <Button 
          onClick={exportTodayData} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {loading ? "Exportando..." : "Exportar CSV de Hoje"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Métricas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Tempo Médio de Espera:</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {avgTimeToday !== null ? `${avgTimeToday} min` : "--"}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={calculateAvgTimeToday}
                >
                  Calcular
                </Button>
              </div>
            </div>
            
            {avgTimeToday !== null && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((avgTimeToday / 60) * 100, 100)}%` }}
                ></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsSettings;
