import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="text-center pt-12 pb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Line-up</h1>
        <p className="text-gray-600 text-lg">Bem-vindo! Pule a fila e entre na nossa lista digital</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <div className="max-w-md mx-auto w-full space-y-8">
          
          {/* Features Preview */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">📱</span>
              </div>
              <span>Receba atualizações em tempo real no seu celular</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-black text-sm">⏱️</span>
              </div>
              <span>Saiba exatamente quando sua mesa estiver pronta</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-black text-sm">🍕</span>
              </div>
              <span>Navegue pelo nosso cardápio enquanto espera</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button onClick={() => navigate("/check-in")} className="w-full h-14 text-lg font-semibold bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">Escanear QR Code</Button>

            <Button onClick={() => navigate("/restaurants")} variant="outline" className="w-full h-14 text-lg font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-200">
              Ver Filas dos Restaurantes
            </Button>
          </div>

          {/* Footer Info */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              Tempo de espera atual: <span className="font-semibold text-black">~25 minutos</span>
            </p>
            <p className="text-xs text-gray-400">
              Avisaremos quando sua mesa estiver pronta
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;