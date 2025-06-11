
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Clock, Menu, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Restaurant {
  id: string;
  name: string;
  menu_url: string | null;
  tolerance_minutes: number | null;
  avg_seat_time_minutes: number | null;
}

interface QueueInfo {
  currentQueue: number;
  estimatedWait: number;
  status: "open" | "closed" | "full";
}

const EstabelecimentoDetalhes = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo>({
    currentQueue: 0,
    estimatedWait: 0,
    status: "open"
  });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Mock events - em uma implementação real, isso viria do banco
  const events = ["Happy Hour", "Música ao Vivo"];

  useEffect(() => {
    if (!restaurantId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    fetchRestaurantData();
    fetchQueueData();
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
      } else {
        setRestaurant(data);
      }
    } catch (error) {
      console.error('Erro ao buscar restaurante:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueData = async () => {
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'waiting');

      if (error) throw error;

      const queueCount = data?.length || 0;
      const estimatedWait = queueCount * 3 + Math.floor(Math.random() * 10);
      
      setQueueInfo({
        currentQueue: queueCount,
        estimatedWait: Math.max(0, estimatedWait),
        status: queueCount >= 20 ? "full" : "open"
      });
    } catch (error) {
      console.error('Erro ao buscar dados da fila:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-green-600 bg-green-50";
      case "full":
        return "text-yellow-600 bg-yellow-50";
      case "closed":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Aberto";
      case "full":
        return "Fila Cheia";
      case "closed":
        return "Fechado";
      default:
        return "Desconhecido";
    }
  };

  const handleEntrarNaFila = () => {
    navigate(`/check-in/${restaurantId}`);
  };

  const handleVerMenu = () => {
    if (restaurant?.menu_url) {
      window.open(restaurant.menu_url, '_blank');
    } else {
      toast({
        title: "Menu não disponível",
        description: "Este estabelecimento ainda não cadastrou seu menu.",
        variant: "destructive",
      });
    }
  };

  const handleFazerReserva = () => {
    navigate("/reserva");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (notFound || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Estabelecimento não encontrado</h1>
          <p className="text-gray-600">O estabelecimento que você está procurando não existe ou foi removido.</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

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
        <h1 className="text-lg font-semibold text-gray-900">Estabelecimento</h1>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Restaurant Info Card */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">🍽️</span>
                  <div>
                    <CardTitle className="text-2xl text-black">{restaurant.name}</CardTitle>
                    <div className="flex items-center space-x-2 text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Rua Exemplo, 123</span>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(queueInfo.status)}`}>
                  {getStatusText(queueInfo.status)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Queue Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">
                      {queueInfo.currentQueue} {queueInfo.currentQueue === 1 ? 'pessoa' : 'pessoas'} na fila
                    </span>
                  </div>
                  
                  {queueInfo.status === "open" && (
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">~{queueInfo.estimatedWait} min</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Events */}
              {events.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 font-medium">Eventos hoje:</span>
                    <div className="flex flex-wrap gap-2">
                      {events.map((event, index) => (
                        <span key={event} className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleEntrarNaFila} 
              className="w-full h-14 text-lg font-semibold bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={queueInfo.status === "closed" || queueInfo.status === "full"}
            >
              {queueInfo.status === "full" ? "Fila Cheia" : "Entrar na Fila"}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleVerMenu} 
                variant="outline" 
                className="h-12 font-semibold flex items-center justify-center space-x-2"
              >
                <Menu className="w-4 h-4" />
                <span>Ver Menu</span>
              </Button>

              <Button 
                onClick={handleFazerReserva} 
                variant="outline" 
                className="h-12 font-semibold flex items-center justify-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Fazer Reserva</span>
              </Button>
            </div>
          </div>

          {/* Info Footer */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              {queueInfo.status === "open" && queueInfo.estimatedWait > 0 && (
                <>Tempo de espera estimado: <span className="font-semibold text-orange-600">{queueInfo.estimatedWait} minutos</span></>
              )}
            </p>
            <p className="text-xs text-gray-400">
              Você receberá notificações quando sua mesa estiver pronta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstabelecimentoDetalhes;
