import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Clock, Search, Menu, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RestaurantFromDB {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean | null;
  current_event: string | null;
  event_type: string | null;
  menu_url: string | null;
  image_url: string | null;
  avg_seat_time_minutes: number | null;
  queue_size: number;
  min_wait_time: number | null;
}

interface RestaurantWithQueue {
  id: string;
  name: string;
  menu_url: string | null;
  currentQueue: number;
  estimatedWait: number;
  status: "open" | "closed" | "full";
  emoji: string;
  type: "bar" | "restaurant";
  events: string[];
  address: string;
}

const Restaurants = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "bar" | "restaurant">("all");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantWithQueue[]>([]);
  const [loading, setLoading] = useState(true);

  const availableEvents = ["Happy Hour", "Música ao Vivo", "Karaokê", "Jogo de Futebol", "Quiz Night", "Menu Especial"];

  // Mapeamento de event_type para texto amigável
  const eventTypeMap: Record<string, string> = {
    'happy_hour': 'Happy Hour',
    'live_music': 'Música ao Vivo',
    'karaoke': 'Karaokê',
    'sports': 'Jogo de Futebol',
    'trivia': 'Quiz Night',
    'special_menu': 'Menu Especial'
  };

  // Emojis baseados na categoria
  const getEmoji = (category: string | null, name: string) => {
    if (category === 'bar') return '🍺';
    if (category === 'cafe') return '☕';
    // Tentar adivinhar pelo nome
    if (name.toLowerCase().includes('pizza')) return '🍕';
    if (name.toLowerCase().includes('burger')) return '🍔';
    if (name.toLowerCase().includes('sushi')) return '🍣';
    return '🍽️';
  };

  useEffect(() => {
    fetchRestaurants();
    
    // Configurar realtime
    const channel = supabase
      .channel('restaurant-live-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'parties' },
        () => {
          fetchRestaurants();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'restaurants' },
        () => {
          fetchRestaurants();
        }
      )
      .subscribe();

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchRestaurants, 10000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRestaurants = async () => {
    try {
      // Buscar da view que já tem as estatísticas
      const { data, error } = await supabase
        .from('restaurant_live_stats')
        .select('*')
        .order('name');

      if (error) throw error;

      // Transformar dados para o formato esperado
      const restaurantsWithQueue: RestaurantWithQueue[] = (data || []).map((restaurant: RestaurantFromDB) => {
        // Calcular tempo estimado
        const estimatedWait = restaurant.queue_size > 0 
          ? restaurant.min_wait_time || (restaurant.queue_size * (restaurant.avg_seat_time_minutes || 45))
          : 0;

        // Processar eventos
        const events: string[] = [];
        if (restaurant.event_type) {
          const eventText = eventTypeMap[restaurant.event_type] || restaurant.event_type;
          events.push(eventText);
        }
        if (restaurant.current_event && !events.includes(restaurant.current_event)) {
          events.push(restaurant.current_event);
        }

        // Determinar status
        let status: "open" | "closed" | "full" = "closed";
        if (restaurant.is_active) {
          status = restaurant.queue_size >= 20 ? "full" : "open";
        }

        return {
          id: restaurant.id,
          name: restaurant.name,
          menu_url: restaurant.menu_url,
          currentQueue: restaurant.queue_size,
          estimatedWait: Math.round(estimatedWait),
          status,
          emoji: getEmoji(restaurant.category, restaurant.name),
          type: restaurant.category === 'bar' ? 'bar' : 'restaurant',
          events,
          address: restaurant.address || 'Endereço não informado'
        };
      });

      setRestaurants(restaurantsWithQueue);
    } catch (error) {
      console.error('Erro ao buscar restaurantes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os estabelecimentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar restaurantes baseado na busca, tipo e eventos
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || restaurant.type === selectedType;
    const matchesEvents = selectedEvents.length === 0 || 
                         selectedEvents.some(event => restaurant.events.includes(event));
    return matchesSearch && matchesType && matchesEvents;
  });

  const handleEventToggle = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event) 
        : [...prev, event]
    );
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

  const getTypeText = (type: string) => {
    return type === "bar" ? "Bar" : "Restaurante";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando estabelecimentos...</p>
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
          <span>Início</span>
        </Button>
        <h1 className="text-lg font-semibold text-black">Lista de Estabelecimentos</h1>
        <div className="w-16"></div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Search Field */}
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Buscar por nome do restaurante ou bar" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pr-10" 
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Filters Section */}
          <div className="space-y-4">
            {/* Type Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tipo de estabelecimento</h3>
              <div className="flex gap-2">
                <Button 
                  variant={selectedType === "all" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setSelectedType("all")} 
                  className="flex-1"
                >
                  Todos
                </Button>
                <Button 
                  variant={selectedType === "bar" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setSelectedType("bar")} 
                  className="flex-1"
                >
                  Bares
                </Button>
                <Button 
                  variant={selectedType === "restaurant" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setSelectedType("restaurant")} 
                  className="flex-1"
                >
                  Restaurantes
                </Button>
              </div>
            </div>

            {/* Events Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Eventos ativos</h3>
              <div className="flex flex-wrap gap-2">
                {availableEvents.map(event => (
                  <Button 
                    key={event} 
                    variant={selectedEvents.includes(event) ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => handleEventToggle(event)} 
                    className="text-xs"
                  >
                    {event}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Updates Info */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Atualizações ao vivo ativas</span>
            </div>
          </div>

          {/* Restaurant Cards */}
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum estabelecimento encontrado</p>
              {restaurants.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  Cadastre estabelecimentos no painel administrativo
                </p>
              )}
            </div>
          ) : (
            filteredRestaurants.map(restaurant => (
              <Card 
                key={restaurant.id} 
                className="shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => navigate(`/check-in/${restaurant.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{restaurant.emoji}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-xl text-black">{restaurant.name}</CardTitle>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {getTypeText(restaurant.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{restaurant.address}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(restaurant.status)}`}>
                      {getStatusText(restaurant.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  {/* Queue Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">
                          {restaurant.currentQueue} {restaurant.currentQueue === 1 ? 'pessoa' : 'pessoas'} na fila
                        </span>
                      </div>
                      
                      {restaurant.status === "open" && restaurant.currentQueue > 0 && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">~{restaurant.estimatedWait} min</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {restaurant.menu_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(restaurant.menu_url!, '_blank');
                        }}
                      >
                        <Menu className="w-4 h-4 mr-2" />
                        Ver Menu
                      </Button>
                    )}
                    {restaurant.status === "open" && (
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/check-in/${restaurant.id}`);
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Entrar na Fila
                      </Button>
                    )}
                  </div>

                  {/* Events */}
                  {restaurant.events.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 font-medium">Eventos hoje:</span>
                        <div className="flex flex-wrap gap-1">
                          {restaurant.events.map((event, index) => (
                            <span key={`${restaurant.id}-${event}`} className="text-xs text-blue-600">
                              {event}{index < restaurant.events.length - 1 ? ' / ' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Restaurants;