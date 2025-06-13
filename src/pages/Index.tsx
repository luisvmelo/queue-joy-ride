
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode, Store, LogIn } from "lucide-react";
import QRScanner from "@/components/QRScanner";

const Index = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);

  const handleScanResult = (result: string) => {
    console.log("QR Code resultado:", result);
    
    try {
      const url = new URL(result);
      const pathSegments = url.pathname.split('/');
      
      if (pathSegments.includes('estabelecimento')) {
        const restaurantIndex = pathSegments.indexOf('estabelecimento');
        const restaurantId = pathSegments[restaurantIndex + 1];
        
        if (restaurantId) {
          navigate(`/estabelecimento/${restaurantId}`);
          return;
        }
      }
      
      if (pathSegments.includes('check-in')) {
        const checkInIndex = pathSegments.indexOf('check-in');
        const restaurantId = pathSegments[checkInIndex + 1];
        
        if (restaurantId) {
          navigate(`/check-in/${restaurantId}`);
          return;
        }
      }
      
      navigate(url.pathname);
    } catch (error) {
      console.error("Erro ao processar QR code:", error);
      if (result.includes('/')) {
        navigate(result);
      }
    }
    
    setShowScanner(false);
  };

  if (showScanner) {
    return (
      <QRScanner
        onScanResult={handleScanResult}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header */}
      <header className="py-6 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">FilaFácil</h1>
        <p className="text-lg text-gray-600">
          Gerencie suas filas de forma inteligente
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 space-y-4">
        {/* QR Scanner Button */}
        <Button
          className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowScanner(true)}
        >
          <QrCode className="w-6 h-6 mr-3" />
          Escanear QR Code
        </Button>

        {/* Browse Restaurants */}
        <Button
          variant="outline"
          className="w-full h-16 text-lg border-blue-200 text-blue-600 hover:bg-blue-50"
          onClick={() => navigate("/restaurants")}
        >
          <Store className="w-6 h-6 mr-3" />
          Ver Estabelecimentos
        </Button>

        {/* Login/Register */}
        <Button
          variant="outline"
          className="w-full h-16 text-lg border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={() => navigate("/auth")}
        >
          <LogIn className="w-6 h-6 mr-3" />
          Entrar / Cadastrar Estabelecimento
        </Button>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-sm text-gray-500">
          Transformando a experiência de espera em restaurantes e bares
        </p>
      </footer>
    </div>
  );
};

export default Index;
