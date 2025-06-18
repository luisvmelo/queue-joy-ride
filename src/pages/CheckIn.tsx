
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";

const CheckIn = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    partySize: "",
  });

  useEffect(() => {
    if (!restaurantId) {
      navigate("/restaurants");
      return;
    }
    fetchRestaurant();
  }, [restaurantId, navigate]);

  const fetchRestaurant = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setRestaurant(data);
    } catch (error: any) {
      console.error('Error fetching restaurant:', error);
      toast({
        title: "Erro",
        description: "Restaurante não encontrado ou inativo",
        variant: "destructive"
      });
      navigate("/restaurants");
    }
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s()+-]+$/;
    const cleanPhone = phone.replace(/\s/g, '');
    return phoneRegex.test(phone) && cleanPhone.length >= 10 && cleanPhone.length <= 15;
  };

  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>"/\\]/g, '').trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    // Validate inputs
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast({
        title: "Erro",
        description: "Telefone deve ter entre 10 e 15 dígitos",
        variant: "destructive"
      });
      return;
    }

    const partySizeNum = parseInt(formData.partySize) || 0;
    if (partySizeNum < 1 || partySizeNum > 20) {
      toast({
        title: "Erro",
        description: "Número de pessoas deve estar entre 1 e 20",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const sanitizedName = sanitizeInput(formData.name);
      const sanitizedPhone = formData.phone.replace(/[^\d+\-\s()]/g, '');

      console.log('Creating party with data:', {
        restaurant_id: restaurantId,
        name: sanitizedName,
        phone: sanitizedPhone,
        party_size: partySizeNum
      });

      const { data, error } = await supabase
        .rpc('create_customer_party', {
          p_restaurant_id: restaurantId,
          p_name: sanitizedName,
          p_phone: sanitizedPhone,
          p_party_size: partySizeNum,
          p_notification_type: 'sms'
        });

      console.log('RPC response:', { data, error });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const { party_id, queue_position } = data[0];
        
        console.log('Party created successfully:', { party_id, queue_position });
        
        // Armazenar credenciais do cliente para acesso seguro
        localStorage.setItem(`party_${party_id}_phone`, sanitizedPhone);
        localStorage.setItem(`party_${party_id}_name`, sanitizedName);

        toast({
          title: "Entrada na fila confirmada! 🎉",
          description: `Você está na posição ${queue_position} da fila.`,
        });

        // Aguardar um pouco para o toast aparecer e então redirecionar
        setTimeout(() => {
          console.log('Redirecting to status page:', `/status/${party_id}`);
          navigate(`/status/${party_id}`, { replace: true });
        }, 1000);

      } else {
        throw new Error('Nenhum dado retornado da criação da party');
      }
    } catch (error: any) {
      console.error('Error joining queue:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao entrar na fila",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              {restaurant.name}
            </CardTitle>
            <CardDescription>
              Entre na fila virtual e aguarde ser chamado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={loading}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usado para notificações sobre sua posição na fila
                </p>
              </div>

              <div>
                <Label htmlFor="partySize">Número de pessoas *</Label>
                <Input
                  id="partySize"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Digite o número de pessoas"
                  value={formData.partySize}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 20)) {
                      setFormData({ ...formData, partySize: value });
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  required
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando na fila...
                  </>
                ) : (
                  "Entrar na Fila"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/restaurants")}
                className="w-full"
                disabled={loading}
              >
                Voltar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckIn;
