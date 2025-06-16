
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Download } from "lucide-react";
import QRCodeGenerator from "@/components/QRCodeGenerator";

interface QRCodeSettingsProps {
  restaurantId: string;
}

const QRCodeSettings = ({ restaurantId }: QRCodeSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuUrl, setMenuUrl] = useState("");

  useEffect(() => {
    loadRestaurantData();
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("name, menu_url")
        .eq("id", restaurantId)
        .single();

      if (error) throw error;

      setRestaurant(data);
      setMenuUrl(data.menu_url || "");
    } catch (error) {
      console.error("Error loading restaurant data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do restaurante",
        variant: "destructive",
      });
    }
  };

  const queueUrl = `${window.location.origin}/check-in/${restaurantId}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "URL copiada para a área de transferência",
    });
  };

  const handleSaveMenuUrl = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ menu_url: menuUrl })
        .eq("id", restaurantId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "URL do cardápio atualizada com sucesso",
      });
    } catch (error) {
      console.error("Error updating menu URL:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar URL do cardápio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">QR Code da Fila</h3>
        {restaurant && (
          <QRCodeGenerator 
            restaurantId={restaurantId} 
            restaurantName={restaurant.name}
          />
        )}
      </div>

      <div>
        <Label htmlFor="queue_url">URL da Fila</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="queue_url"
            value={queueUrl}
            readOnly
            className="bg-gray-50"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => copyToClipboard(queueUrl)}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="menu_url">Link do Cardápio Digital</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="menu_url"
            type="url"
            value={menuUrl}
            onChange={(e) => setMenuUrl(e.target.value)}
            placeholder="https://exemplo.com/cardapio"
          />
          <Button
            type="button"
            onClick={handleSaveMenuUrl}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeSettings;
