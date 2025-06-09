
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Status = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 👋 Mock data - would come from Supabase in real app
  const [partyData, setPartyData] = useState({
    name: "João Silva",
    partySize: 4,
    position: 3,
    totalInQueue: 8,
    estimatedWait: 25,
    toleranceMinutes: 10, // Time to show up when it's their turn
    status: "waiting" // waiting, next, ready, seated
  });

  // 👋 Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPartyData(prev => {
        // Simulate queue movement
        const newPosition = Math.max(0, prev.position - Math.random() * 0.5);
        const newEstimatedWait = Math.max(0, prev.estimatedWait - 2);
        
        return {
          ...prev,
          position: Math.floor(newPosition),
          estimatedWait: Math.floor(newEstimatedWait)
        };
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const progressPercentage = ((partyData.totalInQueue - partyData.position) / partyData.totalInQueue) * 100;

  const handleLeaveQueue = () => {
    toast({
      title: "Removido da lista",
      description: "Você foi removido da fila",
    });
    navigate("/");
  };

  const handleViewMenu = () => {
    window.open("https://example.com/menu", "_blank");
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
        <h1 className="text-lg font-semibold text-gray-900">Status da Fila</h1>
        <div className="w-16"></div>
      </div>

      {/* Status Content */}
      <div className="px-6 pb-6">
        <div className="max-w-md mx-auto space-y-8">
          
          {/* Party Info */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Olá {partyData.name}! 👋</h2>
              <p className="text-gray-600">Grupo de {partyData.partySize} pessoas</p>
            </div>
          </div>

          {/* Position & Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-lg space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">
                #{partyData.position}
              </div>
              <p className="text-gray-600">Sua posição na fila</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progresso</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
            
            {/* Show different content based on position */}
            {partyData.position === 0 ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {partyData.toleranceMinutes} minutos
                </div>
                <p className="text-gray-600">Tempo para chegar ao restaurante</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  ~{partyData.estimatedWait} minutos
                </div>
                <p className="text-gray-600">Tempo estimado de espera</p>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {partyData.position === 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Sua mesa está pronta!</h3>
              <p className="text-green-700">Dirija-se à recepção</p>
              <p className="text-sm text-green-600 mt-2">
                Você tem {partyData.toleranceMinutes} minutos para chegar
              </p>
            </div>
          )}
          
          {partyData.position === 1 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">⏰</div>
              <h3 className="text-xl font-bold text-yellow-800 mb-2">Você é o próximo!</h3>
              <p className="text-yellow-700">Sua mesa ficará pronta em breve</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleViewMenu}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            >
              🍽️ Ver Cardápio
            </Button>
            
            <Button 
              onClick={handleLeaveQueue}
              variant="outline"
              className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50"
            >
              Sair da Fila
            </Button>
          </div>

          {/* Live Updates Info */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Atualizações ao vivo ativas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Status;
