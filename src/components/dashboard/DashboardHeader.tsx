
import { Button } from "@/components/ui/button";
import { PhoneCall, Users } from "lucide-react";
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
            <p className="text-gray-600 flex items-center gap-2">
              {restaurantName || 'Carregando...'}
              <span className="flex items-center gap-1 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                <Users className="w-3 h-3" />
                {totalInQueue} na fila
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={onCallNext}
              disabled={totalInQueue === 0}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 text-base"
            >
              <PhoneCall className="w-5 h-5 mr-2" />
              Chamar Próximo
              {totalInQueue > 0 && (
                <span className="ml-2 bg-white text-green-600 px-2 py-1 rounded-full text-sm font-bold">
                  {totalInQueue}
                </span>
              )}
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
