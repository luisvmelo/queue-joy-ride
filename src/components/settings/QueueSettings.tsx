
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QueueSettingsProps {
  restaurantId: string;
}

const QueueSettings = ({ restaurantId }: QueueSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    max_queue_size: 50,
    default_tolerance_minutes: 2,
    opening_time: "",
    closing_time: "",
    avg_seat_time_minutes: 45,
    welcome_message: "",
    auto_close_at_limit: false,
  });

  useEffect(() => {
    loadQueueSettings();
  }, [restaurantId]);

  const loadQueueSettings = async () => {
    try {
      const [restaurantResponse, settingsResponse] = await Promise.all([
        supabase
          .from("restaurants")
          .select("max_queue_size, default_tolerance_minutes, opening_time, closing_time, avg_seat_time_minutes")
          .eq("id", restaurantId)
          .single(),
        supabase
          .from("restaurant_settings")
          .select("welcome_message, auto_close_at_limit")
          .eq("restaurant_id", restaurantId)
          .single()
      ]);

      if (restaurantResponse.error) throw restaurantResponse.error;

      const restaurant = restaurantResponse.data;
      const settings = settingsResponse.data;

      setFormData({
        max_queue_size: restaurant.max_queue_size || 50,
        default_tolerance_minutes: restaurant.default_tolerance_minutes || 2,
        opening_time: restaurant.opening_time || "",
        closing_time: restaurant.closing_time || "",
        avg_seat_time_minutes: restaurant.avg_seat_time_minutes || 45,
        welcome_message: settings?.welcome_message || "Bem-vindo! Você foi adicionado à nossa fila.",
        auto_close_at_limit: settings?.auto_close_at_limit || false,
      });
    } catch (error) {
      console.error("Error loading queue settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações da fila",
        variant: "destructive",
      });
    }
  };

  const calculateAverageTime = async () => {
    try {
      const { data, error } = await supabase
        .from("queue_history")
        .select("wait_time_minutes")
        .eq("restaurant_id", restaurantId)
        .not("wait_time_minutes", "is", null)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      if (data.length > 0) {
        const average = data.reduce((sum, record) => sum + record.wait_time_minutes, 0) / data.length;
        setFormData({ ...formData, avg_seat_time_minutes: Math.round(average) });
        toast({
          title: "Calculado",
          description: `Tempo médio calculado: ${Math.round(average)} minutos`,
        });
      } else {
        toast({
          title: "Sem dados",
          description: "Não há dados suficientes dos últimos 30 dias",
        });
      }
    } catch (error) {
      console.error("Error calculating average time:", error);
      toast({
        title: "Erro",
        description: "Erro ao calcular tempo médio",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await Promise.all([
        supabase
          .from("restaurants")
          .update({
            max_queue_size: formData.max_queue_size,
            default_tolerance_minutes: formData.default_tolerance_minutes,
            opening_time: formData.opening_time || null,
            closing_time: formData.closing_time || null,
            avg_seat_time_minutes: formData.avg_seat_time_minutes,
          })
          .eq("id", restaurantId),
        supabase
          .from("restaurant_settings")
          .upsert({
            restaurant_id: restaurantId,
            welcome_message: formData.welcome_message,
            auto_close_at_limit: formData.auto_close_at_limit,
          })
      ]);

      toast({
        title: "Sucesso",
        description: "Configurações da fila atualizadas com sucesso",
      });
    } catch (error) {
      console.error("Error updating queue settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações da fila",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max_queue_size">Limite Máximo de Pessoas</Label>
          <Input
            id="max_queue_size"
            type="number"
            min="1"
            value={formData.max_queue_size}
            onChange={(e) => setFormData({ ...formData, max_queue_size: parseInt(e.target.value) })}
          />
        </div>

        <div>
          <Label htmlFor="tolerance">Tempo de Tolerância (minutos)</Label>
          <Input
            id="tolerance"
            type="number"
            min="1"
            value={formData.default_tolerance_minutes}
            onChange={(e) => setFormData({ ...formData, default_tolerance_minutes: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="opening_time">Horário de Abertura</Label>
          <Input
            id="opening_time"
            type="time"
            value={formData.opening_time}
            onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="closing_time">Horário de Fechamento</Label>
          <Input
            id="closing_time"
            type="time"
            value={formData.closing_time}
            onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="avg_time">Tempo Médio de Atendimento (minutos)</Label>
        <div className="flex gap-2">
          <Input
            id="avg_time"
            type="number"
            min="1"
            value={formData.avg_seat_time_minutes}
            onChange={(e) => setFormData({ ...formData, avg_seat_time_minutes: parseInt(e.target.value) })}
          />
          <Button type="button" variant="outline" onClick={calculateAverageTime}>
            Calcular Automaticamente
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="welcome_message">Mensagem de Boas-vindas (160 caracteres)</Label>
        <Textarea
          id="welcome_message"
          value={formData.welcome_message}
          onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
          maxLength={160}
          className="resize-none"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.welcome_message.length}/160 caracteres
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="auto_close"
          checked={formData.auto_close_at_limit}
          onCheckedChange={(checked) => setFormData({ ...formData, auto_close_at_limit: checked })}
        />
        <Label htmlFor="auto_close">Fechar fila automaticamente ao atingir limite</Label>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
};

export default QueueSettings;
