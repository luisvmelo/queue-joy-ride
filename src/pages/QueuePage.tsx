import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Clock, MapPin, Phone, User } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

const QueuePage = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    partySize: 1,
    notificationType: "sms" as const
  });

  useEffect(() => {
    if (restaurantId) {
      loadRestaurantData();
      loadQueueCount();
    } else {
      navigate("/");
    }
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: "Restaurante não encontrado",
          description: "Este QR Code pode estar inválido ou o restaurante não está ativo",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setRestaurant(data);
    } catch (error) {
      console.error('Erro ao carregar restaurante:', error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadQueueCount = async () => {
    try {
      const { count } = await supabase
        .from('parties')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .in('status', ['waiting', 'next', 'ready']);

      setQueueCount(count || 0);
    } catch (error) {
      console.error('Erro ao carregar contagem da fila:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'partySize' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant) return;
    
    setSubmitting(true);

    try {
      // Calcular posição na fila
      const { count: currentQueueCount } = await supabase
        .from('parties')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'waiting');

      const position = (currentQueueCount || 0) + 1;
      
      // Inserir na fila
      const { data: party, error } = await supabase
        .from('parties')
        .insert({
          restaurant_id: restaurant.id,
          name: formData.name,
          phone: formData.phone,
          party_size: formData.partySize,
          notification_type: formData.notificationType,
          status: 'waiting',
          queue_position: position
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Você entrou na fila!",
        description: `Posição: ${position}. Você será notificado quando sua mesa estiver pronta.`,
      });

      // Redirecionar para página de status
      navigate(`/status/${party.id}`);

    } catch (error: any) {
      console.error('Erro ao entrar na fila:', error);
      toast({
        title: "Erro ao entrar na fila",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateEstimatedWait = () => {
    if (!restaurant || queueCount === 0) return "Sem espera";
    
    const avgTime = restaurant.avg_seat_time_minutes || 45;
    const estimatedMinutes = queueCount * avgTime;
    
    if (estimatedMinutes < 60) {
      return `~${estimatedMinutes} min`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      return `~${hours}h ${minutes}min`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando informações do restaurante...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="mb-4">Restaurante não encontrado</p>
            <Button onClick={() => navigate("/")}>
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            {restaurant.description && (
              <p className="text-gray-600 mt-1">{restaurant.description}</p>
            )}
            <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-500">
              {restaurant.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.address}</span>
                </div>
              )}
              {restaurant.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{restaurant.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Queue Status */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5" />
              Status da Fila
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{queueCount}</div>
                <div className="text-sm text-gray-600">pessoas na fila</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{calculateEstimatedWait()}</div>
                <div className="text-sm text-gray-600">tempo estimado</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Join Queue Form */}
        <Card>
          <CardHeader>
            <CardTitle>Entrar na Fila</CardTitle>
            <CardDescription>
              Preencha seus dados e você será notificado quando sua mesa estiver pronta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="partySize">Quantas pessoas? *</Label>
                <select
                  id="partySize"
                  name="partySize"
                  value={formData.partySize}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'pessoa' : 'pessoas'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="notificationType">Como quer ser notificado?</Label>
                <select
                  id="notificationType"
                  name="notificationType"
                  value={formData.notificationType}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="call">Ligação</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 text-lg bg-black text-white hover:bg-gray-800"
              >
                {submitting ? "Entrando na fila..." : "Entrar na Fila"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Você receberá uma notificação quando for sua vez</p>
          <p>Tempo médio de atendimento: {restaurant.avg_seat_time_minutes || 45} minutos</p>
        </div>
      </div>
    </div>
  );
};

export default QueuePage;