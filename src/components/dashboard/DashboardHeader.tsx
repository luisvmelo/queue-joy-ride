
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  restaurantName: string;
  totalInQueue: number;
  onCallNext: () => void;
  onSignOut: () => void;
}

const DashboardHeader = ({ 
  restaurantName, 
  totalInQueue, 
  onCallNext, 
  onSignOut 
}: DashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel do Recepcionista</h1>
            <p className="text-gray-600">{restaurantName || 'Carregando...'}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={onCallNext}
              disabled={totalInQueue === 0}
            >
              <PhoneCall className="w-4 h-4 mr-2" />
              Chamar Próximo
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
            >
              Voltar ao App
            </Button>
            <Button
              variant="outline"
              onClick={onSignOut}
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
