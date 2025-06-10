
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TurnModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  toleranceTimeLeft: number; // Time in seconds
  restaurantName: string;
}

const TurnModal = ({ isOpen, onConfirm, onCancel, toleranceTimeLeft, restaurantName }: TurnModalProps) => {
  const minutes = Math.floor(toleranceTimeLeft / 60);
  const seconds = toleranceTimeLeft % 60;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-black">É Sua Vez!</h1>
          
          <p className="text-lg text-gray-700">
            Sua mesa no {restaurantName} está pronta!
          </p>

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

          <div className="space-y-3">
            <Button 
              onClick={onConfirm}
              className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-full text-lg font-semibold"
            >
              Estou indo
            </Button>
            
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              Cancelar vaga
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnModal;
