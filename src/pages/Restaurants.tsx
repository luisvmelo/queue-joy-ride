
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Clock } from "lucide-react";

interface RestaurantQueue {
  id: string;
  name: string;
  address: string;
  currentQueue: number;
  estimatedWait: number;
  status: "open" | "closed" | "full";
  emoji: string;
}

const Restaurants = () => {
  const navigate = useNavigate();
  
  // Mock data - seria vindo do Supabase em uma aplicação real
  const [restaurants, setRestaurants] = useState<RestaurantQueue[]>([
    {
      id: "1",
      name: "O Cantinho Aconchegante",
      address: "Rua das Flores, 123",
      currentQueue: 8,
      estimatedWait: 25,
      status: "open",
      emoji: "🍽️"
    },
    {
      id: "2", 
      name: "Pizzaria do Bairro",
      address: "Avenida Central, 456",
      currentQueue: 12,
      estimatedWait: 35,
      status: "open",
      emoji: "🍕"
    },
    {
      id: "3",
      name: "Burger Palace",
      address: "Rua do Comércio, 789",
      currentQueue: 15,
      estimatedWait: 40,
      status: "full",
      emoji: "🍔"
    },
    {
      id: "4",
      name: "Sushi Express",
      address: "Praça da Liberdade, 321",
      currentQueue: 0,
      estimatedWait: 0,
      status: "closed",
      emoji: "🍣"
    },
    {
      id: "5",
      name: "Café da Esquina",
      address: "Rua do Café, 654",
      currentQueue: 5,
      estimatedWait: 15,
      status: "open",
      emoji: "☕"
    }
  ]);

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
        <h1 className="text-lg font-semibold text-black">Filas dos Restaurantes</h1>
        <div className="w-16"></div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Live Updates Info */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Atualizações ao vivo ativas</span>
            </div>
          </div>

          {/* Restaurant Cards */}
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{restaurant.emoji}</span>
                    <div>
                      <CardTitle className="text-xl text-black">{restaurant.name}</CardTitle>
                      <p className="text-sm text-gray-600">{restaurant.address}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(restaurant.status)}`}>
                    {getStatusText(restaurant.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Restaurants;
