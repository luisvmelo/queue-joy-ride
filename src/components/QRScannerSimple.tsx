import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Camera, QrCode, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [manualCode, setManualCode] = useState("");

  const handleScanResult = (data: string) => {
    console.log("Processing QR code:", data);
    
    try {
      // Verificar se é uma URL válida
      const url = new URL(data);
      
      // Verificar se é uma URL do nosso app
      if (url.hostname === window.location.hostname || 
          url.hostname.includes('lovableproject.com') ||
          url.hostname.includes('lovable.app')) {
        
        const path = url.pathname;
        
        toast({
          title: "QR Code válido!",
          description: "Redirecionando para o estabelecimento...",
        });
        
        onClose();
        navigate(path);
        
      } else {
        toast({
          title: "Link externo detectado",
          description: "Abrindo link em nova aba...",
        });
        window.open(data, '_blank');
        onClose();
      }
      
    } catch (error) {
      // Se não for uma URL válida, tentar interpretar como código
      if (data.includes('/check-in/') || data.includes('/status/')) {
        navigate(data);
        onClose();
      } else {
        toast({
          title: "QR Code lido",
          description: `Conteúdo: ${data}`,
        });
      }
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      toast({
        title: "Erro",
        description: "Digite o código do QR code",
        variant: "destructive",
      });
      return;
    }
    
    handleScanResult(manualCode.trim());
  };

  const handleNativeCamera = () => {
    // Try to open native camera app
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        // Import qr-scanner dynamically to scan the image
        const QrScanner = (await import('qr-scanner')).default;
        const result = await QrScanner.scanImage(file);
        handleScanResult(result);
      } catch (error) {
        toast({
          title: "Erro ao ler imagem",
          description: "Não foi possível encontrar um QR Code na imagem.",
          variant: "destructive",
        });
      }
    };
    
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Escanear QR Code
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Option 1: Native Camera */}
          <div className="text-center">
            <Button 
              onClick={handleNativeCamera}
              className="w-full h-12 text-base"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Usar Câmera do Celular
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Abre a câmera nativa para tirar foto do QR code
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">ou</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Option 2: Manual Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Digite o código manualmente:
            </label>
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Cole aqui o link ou código do QR"
              className="h-12"
            />
            <Button 
              onClick={handleManualSubmit}
              variant="outline"
              className="w-full h-10"
              disabled={!manualCode.trim()}
            >
              Confirmar Código
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              💡 Dica: Você também pode copiar e colar o link do estabelecimento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;