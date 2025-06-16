
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

interface BrandingSettingsProps {
  restaurantId: string;
}

const availableFonts = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Source Sans Pro",
  "Raleway",
  "Poppins",
];

const BrandingSettings = ({ restaurantId }: BrandingSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    primary_color: "#3B82F6",
    secondary_color: "#1E40AF",
    favicon_url: "",
    google_font: "Inter",
  });

  useEffect(() => {
    loadBrandingSettings();
  }, [restaurantId]);

  const loadBrandingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_settings")
        .select("primary_color, secondary_color, favicon_url, google_font")
        .eq("restaurant_id", restaurantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          primary_color: data.primary_color || "#3B82F6",
          secondary_color: data.secondary_color || "#1E40AF",
          favicon_url: data.favicon_url || "",
          google_font: data.google_font || "Inter",
        });
      }
    } catch (error) {
      console.error("Error loading branding settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de branding",
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
        description: "Configurações de branding atualizadas com sucesso",
      });
    } catch (error) {
      console.error("Error updating branding settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações de branding",
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
          <Label htmlFor="primary_color">Cor Primária</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="primary_color"
              type="color"
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              className="w-16 h-10 p-1 border rounded"
            />
            <Input
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              placeholder="#3B82F6"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="secondary_color">Cor Secundária</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="secondary_color"
              type="color"
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              className="w-16 h-10 p-1 border rounded"
            />
            <Input
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              placeholder="#1E40AF"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="google_font">Fonte Google</Label>
        <Select value={formData.google_font} onValueChange={(value) => setFormData({ ...formData, google_font: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableFonts.map((font) => (
              <SelectItem key={font} value={font}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="favicon">Favicon</Label>
        <div className="flex items-center gap-4 mt-2">
          {formData.favicon_url && (
            <img src={formData.favicon_url} alt="Favicon" className="w-8 h-8 object-cover rounded" />
          )}
          <Button type="button" variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Favicon
          </Button>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
        <h4 className="font-medium mb-2">Preview</h4>
        <div className="space-y-2">
          <div 
            className="w-full h-8 rounded"
            style={{ backgroundColor: formData.primary_color }}
          ></div>
          <div 
            className="w-full h-4 rounded"
            style={{ backgroundColor: formData.secondary_color }}
          ></div>
          <p style={{ fontFamily: formData.google_font }}>
            Exemplo de texto com a fonte {formData.google_font}
          </p>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
};

export default BrandingSettings;
