
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

interface RestaurantSettingsProps {
  restaurantId: string;
}

const RestaurantSettings = ({ restaurantId }: RestaurantSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    loadRestaurantData();
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || "",
        description: data.description || "",
        logo_url: data.logo_url || "",
        street: data.street || "",
        city: data.city || "",
        state: data.state || "",
        zipcode: data.zipcode || "",
        phone: data.phone || "",
        email: data.email || "",
      });
    } catch (error) {
      console.error("Error loading restaurant data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do restaurante",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update(formData)
        .eq("id", restaurantId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados do restaurante atualizados com sucesso",
      });
    } catch (error) {
      console.error("Error updating restaurant:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados do restaurante",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Restaurante *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição Curta (150 caracteres)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          maxLength={150}
          className="resize-none"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.description.length}/150 caracteres
        </p>
      </div>

      <div>
        <Label htmlFor="logo">Logotipo</Label>
        <div className="flex items-center gap-4 mt-2">
          {formData.logo_url && (
            <img src={formData.logo_url} alt="Logo" className="w-16 h-16 object-cover rounded" />
          )}
          <Button type="button" variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Logo
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="street">Rua</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="zipcode">CEP</Label>
            <Input
              id="zipcode"
              value={formData.zipcode}
              onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
              placeholder="00000-000"
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
};

export default RestaurantSettings;
