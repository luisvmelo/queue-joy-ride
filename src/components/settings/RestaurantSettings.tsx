
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Instagram, Phone, Clock } from "lucide-react";

interface RestaurantSettingsProps {
  restaurantId: string;
}

interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
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
    instagram_url: "",
    menu_url: "",
  });

  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: { open: "09:00", close: "22:00", closed: false },
    tuesday: { open: "09:00", close: "22:00", closed: false },
    wednesday: { open: "09:00", close: "22:00", closed: false },
    thursday: { open: "09:00", close: "22:00", closed: false },
    friday: { open: "09:00", close: "22:00", closed: false },
    saturday: { open: "09:00", close: "22:00", closed: false },
    sunday: { open: "09:00", close: "22:00", closed: false },
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

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
        instagram_url: data.instagram_url || "",
        menu_url: data.menu_url || "",
      });

      if (data.detailed_opening_hours && typeof data.detailed_opening_hours === 'object') {
        setOpeningHours(data.detailed_opening_hours as OpeningHours);
      }
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
      // Criar o endereço completo a partir dos campos separados
      const fullAddress = [formData.street, formData.city, formData.state, formData.zipcode]
        .filter(Boolean)
        .join(', ');

      const updateData = {
        ...formData,
        address: fullAddress, // Atualizar também o campo address para compatibilidade
        detailed_opening_hours: openingHours
      };

      const { error } = await supabase
        .from("restaurants")
        .update(updateData)
        .eq("id", restaurantId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados do restaurante atualizados com sucesso",
      });

      // Recarregar os dados para confirmar a atualização
      await loadRestaurantData();
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

  const updateOpeningHours = (day: string, field: string, value: string | boolean) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Informações Básicas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="description">Descrição do Estabelecimento</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Conte um pouco sobre seu estabelecimento..."
                className="resize-none"
                rows={3}
              />
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
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent>
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
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-600" />
                <Input
                  id="instagram"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/seu_restaurante"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="menu">Link do Menu</Label>
              <Input
                id="menu"
                value={formData.menu_url}
                onChange={(e) => setFormData({ ...formData, menu_url: e.target.value })}
                placeholder="https://link-do-seu-menu.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Horário de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day.key} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-32">
                    <Label className="font-medium">{day.label}</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!openingHours[day.key]?.closed}
                      onCheckedChange={(checked) => updateOpeningHours(day.key, 'closed', !checked)}
                    />
                    <span className="text-sm">{openingHours[day.key]?.closed ? 'Fechado' : 'Aberto'}</span>
                  </div>

                  {!openingHours[day.key]?.closed && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={openingHours[day.key]?.open || '09:00'}
                        onChange={(e) => updateOpeningHours(day.key, 'open', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-sm">às</span>
                      <Input
                        type="time"
                        value={openingHours[day.key]?.close || '22:00'}
                        onChange={(e) => updateOpeningHours(day.key, 'close', e.target.value)}
                        className="w-24"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </form>
    </div>
  );
};

export default RestaurantSettings;
