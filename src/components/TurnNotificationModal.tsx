
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Bell } from "lucide-react";

interface TurnNotificationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  toleranceTimeLeft: number;
  restaurantName: string;
  isNextInLine?: boolean;
}

const TurnNotificationModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  toleranceTimeLeft, 
  restaurantName,
  isNextInLine = false 
}: TurnNotificationModalProps) => {
  const [timeLeft, setTimeLeft] = useState(toleranceTimeLeft);

  useEffect(() => {
    if (isOpen && !isNextInLine) {
      // Para o modal "É Sua Vez!", iniciar com tempo de tolerância + 30 segundos
      setTimeLeft(toleranceTimeLeft + 30);
    } else {
      setTimeLeft(toleranceTimeLeft);
    }
  }, [toleranceTimeLeft, isOpen, isNextInLine]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0 || isNextInLine) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeLeft, isNextInLine]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center relative animate-in slide-in-from-bottom duration-300">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-black">
            {isNextInLine ? "Você é o Próximo!" : "É Sua Vez!"}
          </h1>
          
          <p className="text-lg text-gray-700">
            {isNextInLine 
              ? `Prepare-se! Você será chamado em breve no ${restaurantName}`
              : `Sua mesa no ${restaurantName} está pronta!`
            }
          </p>

          {!isNextInLine && (
            <div className="flex justify-center space-x-6">
              <div className="bg-gray-100 rounded-xl p-4 min-w-[80px]">
                <div className="text-3xl font-bold text-black">
                  {minutes.toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600">Minutos</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 min-w-[80px]">
                <div className="text-3xl font-bold text-black">
                  {seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600">Segundos</div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={onConfirm}
              className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-full text-lg font-semibold"
            >
              {isNextInLine ? "Entendi" : "Estou indo"}
            </Button>
            
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              {isNextInLine ? "Ok" : "Cancelar vaga"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnNotificationModal;
