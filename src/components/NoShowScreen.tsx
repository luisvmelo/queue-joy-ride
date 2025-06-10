
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface NoShowScreenProps {
  isOpen: boolean;
  onRejoinQueue: () => void;
  restaurantName: string;
  newPosition: number;
}

const NoShowScreen = ({ isOpen, onRejoinQueue, restaurantName, newPosition }: NoShowScreenProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6">
        <div className="text-center space-y-6 max-w-md">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">⏰</span>
          </div>
          
          {/* Message */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-black">
              Tempo Esgotado
            </h1>
            <p className="text-gray-600 text-lg">
              Você não chegou ao {restaurantName} dentro do tempo de tolerância e perdeu sua vez na fila.
            </p>
            <p className="text-gray-500">
              Não se preocupe! Você pode entrar novamente na fila na posição #{newPosition}.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3 w-full mt-8">
            <Button 
              onClick={onRejoinQueue}
              className="w-full h-12 bg-black text-white hover:bg-gray-800"
            >
              Entrar na Fila (Posição #{newPosition})
            </Button>
            
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full h-12 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoShowScreen;
