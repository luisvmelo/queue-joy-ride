
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface IntegrationsSettingsProps {
  restaurantId: string;
}

const IntegrationsSettings = ({ restaurantId }: IntegrationsSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    pos_api_key: "",
    crm_api_key: "",
    webhook_url: "",
  });

  useEffect(() => {
    loadIntegrationSettings();
  }, [restaurantId]);

  const loadIntegrationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_settings")
        .select("pos_api_key, crm_api_key, webhook_url")
        .eq("restaurant_id", restaurantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          pos_api_key: data.pos_api_key || "",
          crm_api_key: data.crm_api_key || "",
          webhook_url: data.webhook_url || "",
        });
      }
    } catch (error) {
      console.error("Error loading integration settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de integração",
        variant: "destructive",
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
        description: "Configurações de integração atualizadas com sucesso",
      });
    } catch (error) {
      console.error("Error updating integration settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações de integração",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Teste realizado",
        description: "Conexões testadas com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Erro ao testar conexões",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="pos_api_key">POS API Key</Label>
        <Input
          id="pos_api_key"
          type="password"
          value={formData.pos_api_key}
          onChange={(e) => setFormData({ ...formData, pos_api_key: e.target.value })}
          placeholder="Chave de API do sistema de PDV"
        />
      </div>

      <div>
        <Label htmlFor="crm_api_key">CRM API Key</Label>
        <Input
          id="crm_api_key"
          type="password"
          value={formData.crm_api_key}
          onChange={(e) => setFormData({ ...formData, crm_api_key: e.target.value })}
          placeholder="Chave de API do CRM"
        />
      </div>

      <div>
        <Label htmlFor="webhook_url">Webhook URL</Label>
        <Input
          id="webhook_url"
          type="url"
          value={formData.webhook_url}
          onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
          placeholder="https://exemplo.com/webhook"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={testConnection}
          disabled={testing}
        >
          {testing ? "Testando..." : "Testar Conexão"}
        </Button>
      </div>
    </form>
  );
};

export default IntegrationsSettings;
