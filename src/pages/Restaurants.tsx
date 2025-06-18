
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
  menu_url: string;
  avg_seat_time_minutes: number;
  category: string;
  current_event: string;
  event_type: string;
  image_url: string;
  latitude: number;
  longitude: number;
  queue_size: number;
  min_wait_time: number;
}

const Restaurants = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const filtered = restaurants.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRestaurants(filtered);
  }, [searchTerm, restaurants]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase.rpc('get_restaurants_with_stats');
      
      if (error) throw error;
      
      const activeRestaurants = data?.filter(r => r.is_active) || [];
      setRestaurants(activeRestaurants);
      setFilteredRestaurants(activeRestaurants);
    } catch (error) {
      console.error('Erro ao carregar restaurantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantClick = (restaurantId: string) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  const getQueueStatus = (queueSize: number) => {
    if (queueSize === 0) return { text: "Sem fila", color: "text-green-600 bg-green-50" };
    if (queueSize <= 5) return { text: "Fila pequena", color: "text-yellow-600 bg-yellow-50" };
    if (queueSize <= 10) return { text: "Fila média", color: "text-orange-600 bg-orange-50" };
    return { text: "Fila grande", color: "text-red-600 bg-red-50" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4">
          </div>
          <p className="text-gray-600">Carregando restaurantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Restaurantes</h1>
              <p className="text-gray-600">Encontre o melhor lugar para sua experiência</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
            >
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por nome, localização ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 w-full text-lg"
          />
        </div>
      </div>

      {/* Restaurant List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">
              {searchTerm ? "Nenhum restaurante encontrado com sua busca." : "Nenhum restaurante disponível no momento."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => {
              const queueStatus = getQueueStatus(restaurant.queue_size);
              
              return (
                <Card 
                  key={restaurant.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                  onClick={() => handleRestaurantClick(restaurant.id)}
                >
                  {restaurant.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={restaurant.image_url} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                        {restaurant.name}
                      </h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${queueStatus.color}`}>
                        {queueStatus.text}
                      </div>
                    </div>
                    
                    {restaurant.address && (
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="text-sm line-clamp-1">{restaurant.address}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{restaurant.queue_size} na fila</span>
                      </div>
                      
                      {restaurant.min_wait_time > 0 && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>~{restaurant.min_wait_time} min</span>
                        </div>
                      )}
                    </div>
                    
                    {restaurant.current_event && (
                      <div className="mb-3">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          🎉 {restaurant.current_event}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 capitalize">
                        {restaurant.category || 'Restaurante'}
                      </span>
                      
                      <Button 
                        size="sm" 
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Restaurants;
