import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TurnModal from "@/components/TurnModal";
import TimeDisplay from "@/components/TimeDisplay";
import LeaveQueueConfirmation from "@/components/LeaveQueueConfirmation";
import ThankYouScreen from "@/components/ThankYouScreen";
import NoShowScreen from "@/components/NoShowScreen";

const Status = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showTurnModal, setShowTurnModal] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showNoShow, setShowNoShow] = useState(false);
  const [toleranceTimeLeft, setToleranceTimeLeft] = useState(0);
  
  // 👋 Mock data - would come from Supabase in real app
  const [partyData, setPartyData] = useState({
    name: "", // Will be set from localStorage
    partySize: 4,
    position: 3,
    totalInQueue: 8,
    estimatedWait: 25,
    toleranceMinutes: 2, // Changed from 10 to 2 minutes
    status: "waiting", // waiting, next, ready, seated
    restaurantName: "O Cantinho Aconchegante"
  });

  // Load party data from localStorage (simulating real data)
  useEffect(() => {
    const savedPartyData = localStorage.getItem('partyData');
    if (savedPartyData) {
      const parsed = JSON.parse(savedPartyData);
      setPartyData(prev => ({
        ...prev,
        name: parsed.name || "Usuário",
        partySize: parsed.partySize || 4
      }));
    } else {
      // Fallback if no data saved
      setPartyData(prev => ({
        ...prev,
        name: "Usuário"
      }));
    }
  }, []);

  // Initialize tolerance time when position becomes 0
  useEffect(() => {
    if (partyData.position === 0) {
      setToleranceTimeLeft(partyData.toleranceMinutes * 60);
    }
  }, [partyData.position, partyData.toleranceMinutes]);

  // Updated tolerance countdown to show NoShow screen when time runs out
  useEffect(() => {
    if (partyData.position === 0 && toleranceTimeLeft > 0) {
      const interval = setInterval(() => {
        setToleranceTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Show NoShow screen when time runs out
            setShowTurnModal(false);
            setShowNoShow(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [partyData.position, toleranceTimeLeft]);

  // 👋 Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPartyData(prev => {
        // Simulate queue movement
        const newPosition = Math.max(0, prev.position - Math.random() * 0.5);
        const newEstimatedWait = Math.max(0, prev.estimatedWait - 2);
        
        const updatedData = {
          ...prev,
          position: Math.floor(newPosition),
          estimatedWait: Math.floor(newEstimatedWait)
        };

        // Show turn modal when position becomes 0
        if (updatedData.position === 0 && prev.position > 0) {
          setShowTurnModal(true);
        }

        return updatedData;
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const progressPercentage = ((partyData.totalInQueue - partyData.position) / partyData.totalInQueue) * 100;

  const handleLeaveQueue = () => {
    setShowLeaveConfirmation(true);
  };

  const handleCancelLeave = () => {
    setShowLeaveConfirmation(false);
  };

  const handleConfirmLeave = () => {
    setShowLeaveConfirmation(false);
    setShowThankYou(true);
    toast({
      title: "Removido da lista",
      description: "Você foi removido da fila",
    });
  };

  const handleJoinAgain = () => {
    setShowThankYou(false);
    navigate("/check-in");
  };

  const handleViewMenu = () => {
    window.open("https://example.com/menu", "_blank");
  };

  const handleConfirmTurn = () => {
    setShowTurnModal(false);
    toast({
      title: "Confirmado!",
      description: "Dirija-se à recepção do restaurante",
    });
  };

  const handleCancelTurn = () => {
    setShowTurnModal(false);
    handleLeaveQueue();
  };

  const handleRejoinQueue = () => {
    setShowNoShow(false);
    // Update position to next available (simulate being moved to position 2)
    setPartyData(prev => ({
      ...prev,
      position: prev.position + 1,
      estimatedWait: 15 // Reset estimated wait time
    }));
    // Reset tolerance time
    setToleranceTimeLeft(0);
    toast({
      title: "Reinserido na fila",
      description: `Você foi colocado na posição #${partyData.position + 1}`,
    });
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
        <h1 className="text-lg font-semibold text-black">Status da Fila</h1>
        <div className="w-16"></div>
      </div>

      {/* Status Content */}
      <div className="px-6 pb-6">
        <div className="max-w-md mx-auto space-y-8">
          
          {/* Party Info */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-black">Olá {partyData.name}! 👋</h2>
              <p className="text-gray-600">Grupo de {partyData.partySize} pessoas</p>
            </div>
          </div>

          {/* Position & Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-lg space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">
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
            
            {/* Status Messages inside the card */}
            {partyData.position === 0 && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="text-xl font-bold text-black mb-2">Sua mesa está pronta!</h3>
                <p className="text-gray-700">Dirija-se à recepção</p>
                <p className="text-sm text-gray-600 mt-2">
                  Você tem {Math.floor(toleranceTimeLeft / 60)} minutos para chegar
                </p>
              </div>
            )}
            
            {partyData.position === 1 && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2">⏰</div>
                <h3 className="text-xl font-bold text-black mb-2">Você é o próximo!</h3>
                <p className="text-gray-700">Sua mesa ficará pronta em breve</p>
              </div>
            )}
            
            {/* Show different content based on position */}
            {partyData.position === 0 ? (
              <TimeDisplay
                timeInSeconds={toleranceTimeLeft}
                label="Tempo para chegar ao restaurante"
                className="text-center"
              />
            ) : (
              <TimeDisplay
                initialMinutes={partyData.estimatedWait}
                label="Tempo estimado de espera"
                isCountdown={true}
                className="text-center"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleViewMenu}
              className="w-full h-12 bg-black text-white hover:bg-gray-800"
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

      {/* Turn Modal */}
      <TurnModal
        isOpen={showTurnModal}
        onConfirm={handleConfirmTurn}
        onCancel={handleCancelTurn}
        toleranceTimeLeft={toleranceTimeLeft}
        restaurantName={partyData.restaurantName}
      />

      {/* Leave Queue Confirmation */}
      <LeaveQueueConfirmation
        isOpen={showLeaveConfirmation}
        onCancel={handleCancelLeave}
        onConfirm={handleConfirmLeave}
        restaurantName={partyData.restaurantName}
      />

      {/* Thank You Screen */}
      <ThankYouScreen
        isOpen={showThankYou}
        onJoinAgain={handleJoinAgain}
        restaurantName={partyData.restaurantName}
      />

      {/* No Show Screen */}
      <NoShowScreen
        isOpen={showNoShow}
        onRejoinQueue={handleRejoinQueue}
        restaurantName={partyData.restaurantName}
        newPosition={partyData.position + 1}
      />
    </div>
  );
};

export default Status;
