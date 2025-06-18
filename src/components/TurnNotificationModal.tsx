
import { useState, useEffect, useRef } from "react";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Simple vibration when modal opens
    if (isOpen && 'vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center relative animate-in slide-in-from-bottom zoom-in duration-500 shadow-2xl border-4 border-orange-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <Bell className="w-10 h-10 text-orange-600 animate-bounce" />
            </div>
          </div>

          <h1 className={`text-4xl font-bold ${isNextInLine ? 'text-blue-600' : 'text-orange-600'} animate-pulse`}>
            {isNextInLine ? "🔔 Você é o Próximo!" : "🎉 É Sua Vez!"}
          </h1>
          
          <p className="text-lg text-gray-700">
            {isNextInLine 
              ? `Prepare-se! Você será chamado em breve no ${restaurantName}`
              : `Sua mesa no ${restaurantName} está pronta!`
            }
          </p>

          {!isNextInLine && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-700 text-center">
                📍 Dirija-se ao restaurante agora! Você tem tempo limitado para chegar.
              </p>
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
        
        {/* Audio for modal notification */}
        <audio ref={audioRef} preload="auto">
          <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTiR1/L" type="audio/wav" />
        </audio>
      </div>
    </div>
  );
};

export default TurnNotificationModal;
