
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Clock, Menu, Calendar, MapPin, Phone, Instagram, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  instagram_url: string | null;
  menu_url: string | null;
  detailed_opening_hours: any;
  street: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  logo_url: string | null;
}

interface QueueInfo {
  currentQueue: number;
  estimatedWait: number;
  status: "open" | "closed" | "full";
}

const RestaurantDetails = () => {
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
      const estimatedWait = queueCount * 3;
      
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

  const formatAddress = () => {
    const parts = [restaurant?.street, restaurant?.city, restaurant?.state, restaurant?.zipcode].filter(Boolean);
    return parts.join(', ') || 'Endereço não informado';
  };

  const formatOpeningHours = (hours: any): string[] => {
    if (!hours) return ['Horários não informados'];
    
    return daysOfWeek.map(day => {
      const dayHours = hours[day.key];
      if (!dayHours) return `${day.label}: Fechado`;
      
      if (dayHours.closed) {
        return `${day.label}: Fechado`;
      }
      
      return `${day.label}: ${dayHours.open} - ${dayHours.close}`;
    });
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

  const handleInstagramClick = () => {
    if (restaurant?.instagram_url) {
      window.open(restaurant.instagram_url, '_blank');
    }
  };

  const handlePhoneClick = () => {
    if (restaurant?.phone) {
      window.open(`tel:${restaurant.phone}`, '_self');
    }
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
        <h1 className="text-lg font-semibold text-gray-900">Detalhes</h1>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Restaurant Header Card */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {restaurant.logo_url ? (
                    <img src={restaurant.logo_url} alt="Logo" className="w-12 h-12 object-cover rounded-full" />
                  ) : (
                    <span className="text-3xl">🍽️</span>
                  )}
                  <div>
                    <CardTitle className="text-2xl text-black">{restaurant.name}</CardTitle>
                    <div className="flex items-center space-x-2 text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{formatAddress()}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(queueInfo.status)}`}>
                  {getStatusText(queueInfo.status)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Description */}
              {restaurant.description && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-sm">{restaurant.description}</p>
                </div>
              )}

              {/* Queue Info */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
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
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {restaurant.phone && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-green-600" />
                    <span className="font-medium">{restaurant.phone}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={handlePhoneClick}>
                    Ligar
                  </Button>
                </div>
              )}
              
              {restaurant.instagram_url && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Instagram className="w-5 h-5 text-pink-600" />
                    <span className="font-medium">Instagram</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleInstagramClick}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opening Hours */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Horário de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {formatOpeningHours(restaurant.detailed_opening_hours).map((dayHour, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-gray-700">{dayHour.split(':')[0]}:</span>
                    <span className="text-gray-600">{dayHour.split(':').slice(1).join(':').trim()}</span>
                  </div>
                ))}
              </div>
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

            <Button 
              onClick={handleVerMenu} 
              variant="outline" 
              className="w-full h-12 font-semibold flex items-center justify-center space-x-2"
            >
              <Menu className="w-4 h-4" />
              <span>Ver Menu</span>
            </Button>
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

export default RestaurantDetails;
