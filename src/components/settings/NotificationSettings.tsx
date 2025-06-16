
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NotificationSettingsProps {
  restaurantId: string;
}

const NotificationSettings = ({ restaurantId }: NotificationSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    notification_channels: ["sms"],
    reminder_5min: false,
    peak_alert_staff: true,
  });

  useEffect(() => {
    loadNotificationSettings();
  }, [restaurantId]);

  const loadNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_settings")
        .select("notification_channels, reminder_5min, peak_alert_staff")
        .eq("restaurant_id", restaurantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          notification_channels: data.notification_channels || ["sms"],
          reminder_5min: data.reminder_5min || false,
          peak_alert_staff: data.peak_alert_staff ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de notificação",
        variant: "destructive",
      });
    }
  };

  const handleChannelChange = (channel: string, checked: boolean) => {
    if (checked) {
      setFormData({ 
        ...formData, 
        notification_channels: [...formData.notification_channels, channel] 
      });
    } else {
      setFormData({ 
        ...formData, 
        notification_channels: formData.notification_channels.filter(c => c !== channel) 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("restaurant_settings")
        .upsert({
          restaurant_id: restaurantId,
          ...formData,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações de notificação atualizadas com sucesso",
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações de notificação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-base font-medium">Canais de Notificação</Label>
        <div className="space-y-2 mt-2">
          {[
            { id: "sms", label: "SMS" },
            { id: "whatsapp", label: "WhatsApp" },
            { id: "push", label: "Push Notifications" },
          ].map((channel) => (
            <div key={channel.id} className="flex items-center space-x-2">
              <Checkbox
                id={channel.id}
                checked={formData.notification_channels.includes(channel.id)}
                onCheckedChange={(checked) => handleChannelChange(channel.id, checked as boolean)}
              />
              <Label htmlFor={channel.id}>{channel.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="reminder_5min"
            checked={formData.reminder_5min}
            onCheckedChange={(checked) => setFormData({ ...formData, reminder_5min: checked as boolean })}
          />
          <Label htmlFor="reminder_5min">Enviar lembrete 5 minutos antes da vez</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="peak_alert_staff"
            checked={formData.peak_alert_staff}
            onCheckedChange={(checked) => setFormData({ ...formData, peak_alert_staff: checked as boolean })}
          />
          <Label htmlFor="peak_alert_staff">Alerta de pico para staff</Label>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
};

export default NotificationSettings;
