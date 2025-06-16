
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VisibilitySettingsProps {
  restaurantId: string;
}

const availableTags = [
  "Vegano",
  "Vegetariano",
  "Pet-friendly",
  "Wi-Fi Grátis",
  "Estacionamento",
  "Delivery",
  "Takeout",
  "Música ao Vivo",
  "Terraço",
  "Bar",
  "Família",
  "Romântico",
];

const VisibilitySettings = ({ restaurantId }: VisibilitySettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    visible_in_guide: true,
    category: "restaurant",
    tags: [] as string[],
  });

  useEffect(() => {
    loadVisibilitySettings();
  }, [restaurantId]);

  const loadVisibilitySettings = async () => {
    try {
      const [restaurantResponse, settingsResponse] = await Promise.all([
        supabase
          .from("restaurants")
          .select("category")
          .eq("id", restaurantId)
          .single(),
        supabase
          .from("restaurant_settings")
          .select("visible_in_guide, tags")
          .eq("restaurant_id", restaurantId)
          .single()
      ]);

      if (restaurantResponse.error) throw restaurantResponse.error;

      const restaurant = restaurantResponse.data;
      const settings = settingsResponse.data;

      setFormData({
        visible_in_guide: settings?.visible_in_guide ?? true,
        category: restaurant.category || "restaurant",
        tags: settings?.tags || [],
      });
    } catch (error) {
      console.error("Error loading visibility settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de visibilidade",
        variant: "destructive",
      });
    }
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    } else {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await Promise.all([
        supabase
          .from("restaurants")
          .update({ category: formData.category })
          .eq("id", restaurantId),
        supabase
          .from("restaurant_settings")
          .upsert({
            restaurant_id: restaurantId,
            visible_in_guide: formData.visible_in_guide,
            tags: formData.tags,
          })
      ]);

      toast({
        title: "Sucesso",
        description: "Configurações de visibilidade atualizadas com sucesso",
      });
    } catch (error) {
      console.error("Error updating visibility settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações de visibilidade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-2">
        <Switch
          id="visible_in_guide"
          checked={formData.visible_in_guide}
          onCheckedChange={(checked) => setFormData({ ...formData, visible_in_guide: checked })}
        />
        <Label htmlFor="visible_in_guide">Visível no guia público</Label>
      </div>

      <div>
        <Label className="text-base font-medium">Categoria</Label>
        <RadioGroup
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="restaurant" id="restaurant" />
            <Label htmlFor="restaurant">Restaurante</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="bar" id="bar" />
            <Label htmlFor="bar">Bar</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="text-base font-medium">Tags</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {availableTags.map((tag) => (
            <div key={tag} className="flex items-center space-x-2">
              <Checkbox
                id={tag}
                checked={formData.tags.includes(tag)}
                onCheckedChange={(checked) => handleTagChange(tag, checked as boolean)}
              />
              <Label htmlFor={tag} className="text-sm">
                {tag}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
};

export default VisibilitySettings;
