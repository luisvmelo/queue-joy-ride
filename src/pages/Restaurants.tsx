
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Clock, Search, Menu, Calendar } from "lucide-react";

interface RestaurantQueue {
  id: string;
  name: string;
  address: string;
  currentQueue: number;
  estimatedWait: number;
  status: "open" | "closed" | "full";
  emoji: string;
  type: "bar" | "restaurant";
  events: string[];
}

const Restaurants = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "bar" | "restaurant">("all");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  
  // Mock data - seria vindo do Supabase em uma aplicação real
  const [restaurants, setRestaurants] = useState<RestaurantQueue[]>([
    {
      id: "1",
      name: "O Cantinho Aconchegante",
      address: "Rua das Flores, 123",
      currentQueue: 8,
      estimatedWait: 25,
      status: "open",
      emoji: "🍽️",
      type: "restaurant",
      events: ["Happy Hour", "Música ao Vivo"]
    },
    {
      id: "2", 
      name: "Pizzaria do Bairro",
      address: "Avenida Central, 456",
      currentQueue: 12,
      estimatedWait: 35,
      status: "open",
      emoji: "🍕",
      type: "restaurant",
      events: ["Karaokê"]
    },
    {
      id: "3",
      name: "Burger Palace",
      address: "Rua do Comércio, 789",
      currentQueue: 15,
      estimatedWait: 40,
      status: "full",
      emoji: "🍔",
      type: "restaurant",
      events: ["Jogo de Futebol"]
    },
    {
      id: "4",
      name: "Sushi Express",
      address: "Praça da Liberdade, 321",
      currentQueue: 0,
      estimatedWait: 0,
      status: "closed",
      emoji: "🍣",
      type: "restaurant",
      events: []
    },
    {
      id: "5",
      name: "Bar da Esquina",
      address: "Rua do Café, 654",
      currentQueue: 5,
      estimatedWait: 15,
      status: "open",
      emoji: "🍺",
      type: "bar",
      events: ["Happy Hour", "Clone de Chopp"]
    },
    {
      id: "6",
      name: "Boteco do João",
      address: "Rua dos Bares, 987",
      currentQueue: 3,
      estimatedWait: 10,
      status: "open",
      emoji: "🍻",
      type: "bar",
      events: ["Clone de Drink", "Música ao Vivo"]
    }
  ]);

  const availableEvents = [
    "Clone de Chopp",
    "Clone de Drink", 
    "Happy Hour",
    "Karaokê",
    "Música ao Vivo",
    "Jogo de Futebol"
  ];

  // Simulação de atualizações em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setRestaurants(prev => prev.map(restaurant => {
        if (restaurant.status === "open") {
          const queueChange = Math.floor(Math.random() * 3) - 1; // -1, 0, ou 1
          const newQueue = Math.max(0, restaurant.currentQueue + queueChange);
          const newWait = Math.max(0, newQueue * 3 + Math.floor(Math.random() * 10));
          
          return {
            ...restaurant,
            currentQueue: newQueue,
            estimatedWait: newWait,
            status: newQueue >= 20 ? "full" : "open"
          };
        }
        return restaurant;
      }));
    }, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Filtrar restaurantes baseado na busca, tipo e eventos
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
                {availableEvents.map((event) => (
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
            </div>
          ) : (
            filteredRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="shadow-lg hover:shadow-xl transition-shadow">
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
                      
                      {restaurant.status === "open" && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">~{restaurant.estimatedWait} min</span>
                        </div>
                      )}
                    </div>
                    
                    {restaurant.status === "open" && (
                      <Button 
                        size="sm"
                        className="bg-black text-white hover:bg-gray-800"
                        onClick={() => navigate("/check-in")}
                      >
                        Entrar na Fila
                      </Button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => navigate("/menu")}
                    >
                      <Menu className="w-4 h-4 mr-2" />
                      Ver Menu
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => navigate("/reserva")}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Fazer Reserva
                    </Button>
                  </div>

                  {/* Events */}
                  {restaurant.events.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 font-medium">Eventos hoje:</span>
                        <div className="flex flex-wrap gap-1">
                          {restaurant.events.map((event, index) => (
                            <span key={event} className="text-xs text-blue-600">
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
