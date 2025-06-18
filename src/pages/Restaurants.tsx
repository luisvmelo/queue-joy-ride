import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Clock, Users, Filter, X } from "lucide-react";
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    fetchRestaurants();
  }, []);
  useEffect(() => {
    let filtered = restaurants.filter(restaurant => restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) || restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) || restaurant.category?.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(restaurant => restaurant.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by event type
    if (selectedEventType !== "all") {
      filtered = filtered.filter(restaurant => restaurant.event_type?.toLowerCase() === selectedEventType.toLowerCase());
    }
    setFilteredRestaurants(filtered);
  }, [searchTerm, restaurants, selectedCategory, selectedEventType]);
  const fetchRestaurants = async () => {
    try {
      const {
        data,
        error
      } = await supabase.rpc('get_restaurants_with_stats');
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
    if (queueSize === 0) return {
      text: "Sem fila",
      color: "text-green-600"
    };
    if (queueSize <= 5) return {
      text: "Fila pequena",
      color: "text-yellow-600"
    };
    if (queueSize <= 10) return {
      text: "Fila média",
      color: "text-orange-600"
    };
    return {
      text: "Fila grande",
      color: "text-red-600"
    };
  };
  const getCategoryEmoji = (category: string) => {
    const categoryLower = category?.toLowerCase() || '';
    if (categoryLower.includes('restaurante') || categoryLower.includes('restaurant')) return '🍽️';
    if (categoryLower.includes('bar')) return '🍺';
    if (categoryLower.includes('café') || categoryLower.includes('cafe')) return '☕';
    if (categoryLower.includes('lanchonete')) return '🍔';
    if (categoryLower.includes('pizzaria')) return '🍕';
    if (categoryLower.includes('sorveteria')) return '🍦';
    if (categoryLower.includes('padaria')) return '🥖';
    return '🍽️';
  };
  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedEventType("all");
    setSearchTerm("");
  };
  const getUniqueCategories = () => {
    const categories = restaurants.map(r => r.category).filter(Boolean);
    return [...new Set(categories)];
  };
  const getUniqueEventTypes = () => {
    const eventTypes = restaurants.map(r => r.event_type).filter(Boolean);
    return [...new Set(eventTypes)];
  };
  const formatCategoryForDisplay = (category: string) => {
    // Remove emojis and clean up the text
    return category?.replace(/[^\w\s]/gi, '').trim() || category;
  };
  const formatEventTypeForDisplay = (eventType: string) => {
    // Clean up event type text, convert underscores to spaces and capitalize
    return eventType?.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') || eventType;
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4">
          </div>
          <p className="text-gray-600">Carregando restaurantes...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Restaurantes</h1>
              <p className="text-gray-600 mt-1">Encontre o melhor lugar para sua experiência</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input type="text" placeholder="Buscar por nome, localização ou categoria..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-3 w-full text-lg" />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
              {(selectedCategory !== "all" || selectedEventType !== "all") && <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {(selectedCategory !== "all" ? 1 : 0) + (selectedEventType !== "all" ? 1 : 0)}
                </span>}
            </Button>

            {(selectedCategory !== "all" || selectedEventType !== "all" || searchTerm) && <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />
                Limpar filtros
              </Button>}
          </div>

          {/* Filter Options */}
          {showFilters && <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {getUniqueCategories().map(category => <SelectItem key={category} value={category}>
                          {formatCategoryForDisplay(category)}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 flex flex-col justify-start gap-2 h-fit\n">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Evento
                  </label>
                  <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os eventos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os eventos</SelectItem>
                      {getUniqueEventTypes().map(eventType => <SelectItem key={eventType} value={eventType}>
                          {formatEventTypeForDisplay(eventType)}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>}
        </div>
      </div>

      {/* Restaurant List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredRestaurants.length === 0 ? 
          <div className="text-center py-16">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <p className="text-xl text-gray-600 mb-2">
                {searchTerm || selectedCategory !== "all" || selectedEventType !== "all" ? "Nenhum restaurante encontrado com os filtros aplicados." : "Nenhum restaurante disponível no momento."}
              </p>
              {(searchTerm || selectedCategory !== "all" || selectedEventType !== "all") && <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Limpar filtros
                </Button>}
            </div>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredRestaurants.map(restaurant => {
          const queueStatus = getQueueStatus(restaurant.queue_size);
          const categoryEmoji = getCategoryEmoji(restaurant.category);
          return <Card key={restaurant.id} className="cursor-pointer hover:shadow-lg transition-shadow min-h-[320px]" onClick={() => handleRestaurantClick(restaurant.id)}>
                  {restaurant.image_url && <div className="h-52 overflow-hidden">
                      <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
                    </div>}
                  
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-xl text-gray-900 leading-tight">
                          {restaurant.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${queueStatus.color} bg-opacity-10 whitespace-nowrap ml-2`}>
                          {queueStatus.text}
                        </span>
                      </div>
                      
                      {restaurant.address && <div className="flex items-start text-gray-600 mb-4">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">{restaurant.address}</span>
                        </div>}
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{restaurant.queue_size} na fila</span>
                        </div>
                        
                        {restaurant.min_wait_time > 0 && <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>~{restaurant.min_wait_time} min</span>
                          </div>}
                      </div>
                      
                      {restaurant.current_event && <div className="mb-4">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-2 rounded-full">
                            🎉 {formatEventTypeForDisplay(restaurant.current_event)}
                          </span>
                        </div>}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-500 capitalize flex items-center">
                        <span className="mr-2">{categoryEmoji}</span>
                        <span>{formatCategoryForDisplay(restaurant.category) || 'Restaurante'}</span>
                      </span>
                      
                      <Button size="sm" className="px-4 py-2">
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>;
        })}
          </div>}
      </div>
    </div>;
};
export default Restaurants;
