import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, ArrowLeft } from "lucide-react";

const CheckIn = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [currentQueueSize, setCurrentQueueSize] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    partySize: "2"
  });

  useEffect(() => {
    if (restaurantId) {
      console.log("Restaurant ID from URL:", restaurantId);
      loadRestaurantInfo();
    } else {
      toast({
        title: "Erro",
        description: "ID do restaurante não encontrado na URL",
        variant: "destructive"
      });
      setLoadingRestaurant(false);
    }
  }, [restaurantId]);

  const loadRestaurantInfo = async () => {
    try {
      setLoadingRestaurant(true);
      
      // Buscar informações do restaurante (only active restaurants are visible due to RLS)
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();

      console.log("Restaurant query result:", { restaurantData, restaurantError });

      if (restaurantError) {
        if (restaurantError.code === 'PGRST116') {
          toast({
            title: "Restaurante não encontrado",
            description: `Este restaurante não está ativo ou não existe`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro ao buscar restaurante",
            description: restaurantError.message,
            variant: "destructive"
          });
        }
        navigate("/");
        return;
      }

      if (!restaurantData) {
        toast({
          title: "Erro",
          description: "Dados do restaurante não encontrados",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setRestaurant(restaurantData);

      // Contar tamanho atual da fila - only visible parties due to RLS
      const { count, error: countError } = await supabase
        .from('parties')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .in('status', ['waiting', 'next', 'ready']);

      if (countError) {
        console.error('Erro ao contar fila:', countError);
      } else {
        setCurrentQueueSize(count || 0);
      }

    } catch (error) {
      console.error('Erro ao carregar restaurante:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar informações do restaurante",
        variant: "destructive"
      });
      navigate("/");
    } finally {
      setLoadingRestaurant(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurantId || !restaurant) {
      toast({
        title: "Erro",
        description: "Informações do restaurante não disponíveis",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Validar dados
      if (!formData.name.trim() || !formData.phone.trim()) {
        throw new Error("Por favor, preencha todos os campos");
      }

      // Validar telefone (formato brasileiro)
      const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}[-\s]?\d{4})$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        throw new Error("Por favor, insira um telefone válido");
      }

      // Verificar se o cliente já está na fila (check by phone and restaurant)
      const { data: existingEntry, error: checkError } = await supabase
        .from('parties')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('phone', formData.phone)
        .in('status', ['waiting', 'next', 'ready'])
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingEntry) {
        toast({
          title: "Você já está na fila!",
          description: "Redirecionando para acompanhar sua posição...",
        });
        navigate(`/status/${existingEntry.id}`);
        return;
      }

      // Calcular próxima posição na fila
      const nextPosition = currentQueueSize + 1;

      // Criar entrada na fila
      const { data: newEntry, error: insertError } = await supabase
        .from('parties')
        .insert({
          restaurant_id: restaurantId,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          party_size: parseInt(formData.partySize),
          queue_position: nextPosition,
          initial_position: nextPosition,
          status: 'waiting',
          joined_at: new Date().toISOString(),
          estimated_wait_minutes: nextPosition * (restaurant.avg_seat_time_minutes || 45),
          tolerance_minutes: restaurant.default_tolerance_minutes || 10
        })
        .select()
        .single();

      console.log("Insert result:", { newEntry, insertError });

      if (insertError) {
        console.error("Erro ao inserir na fila:", insertError);
        throw insertError;
      }

      toast({
        title: "Check-in realizado!",
        description: `Você está na posição #${nextPosition} da fila.`,
      });

      // Redirecionar para a página de status
      navigate(`/status/${newEntry.id}`);

    } catch (error: any) {
      console.error("Erro no check-in:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao entrar na fila",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando informações do restaurante...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Restaurante não encontrado ou não está ativo</p>
            <Button onClick={() => navigate("/")}>
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calcular tempo estimado
  const estimatedTime = restaurant.avg_seat_time_minutes 
    ? (currentQueueSize + 1) * restaurant.avg_seat_time_minutes
    : (currentQueueSize + 1) * 45;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Button>
      </div>

      <div className="px-4 pb-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Check-in Digital</CardTitle>
            <CardDescription>
              <span className="font-semibold text-lg">{restaurant.name}</span>
              {restaurant.address && (
                <span className="block text-sm mt-1">{restaurant.address}</span>
              )}
              {currentQueueSize > 0 && (
                <span className="block text-sm mt-2">
                  {currentQueueSize} {currentQueueSize === 1 ? 'pessoa' : 'pessoas'} na fila
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usaremos para notificar quando sua mesa estiver pronta
                </p>
              </div>

              <div>
                <Label htmlFor="partySize">Número de pessoas</Label>
                <select
                  id="partySize"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.partySize}
                  onChange={(e) => setFormData({ ...formData, partySize: e.target.value })}
                  disabled={loading}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'pessoa' : 'pessoas'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimativa de tempo */}
              {currentQueueSize > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-blue-900">
                    ⏱️ Tempo estimado de espera: ~{estimatedTime} minutos
                  </p>
                  <p className="text-xs text-blue-700">
                    {currentQueueSize} {currentQueueSize === 1 ? 'pessoa' : 'pessoas'} na frente
                  </p>
                </div>
              )}

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
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Entrar na fila
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate("/")}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckIn;
