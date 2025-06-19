import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserQRCodeReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { X, Camera, CameraOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeScanner = async () => {
      if (!videoRef.current) return;

      try {
        const reader = new BrowserQRCodeReader();
        readerRef.current = reader;
        
        // Get available video devices
        const videoInputDevices = await reader.getVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError("Nenhuma câmera encontrada no dispositivo");
          return;
        }

        // Use the back camera if available, otherwise use the first camera
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

        // Start scanning
        await reader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              console.log("QR Code escaneado:", result.getText());
              handleScanResult(result.getText());
            }
            if (error && error.name !== 'NotFoundException') {
              console.error("Scan error:", error);
            }
          }
        );
        
        setIsScanning(true);
        setError(null);
        
      } catch (err: any) {
        console.error("Erro ao inicializar scanner:", err);
        
        let errorMessage = "Erro ao acessar a câmera.";
        
        if (err.name === 'NotAllowedError') {
          errorMessage = "Permissão negada. Permita o acesso à câmera.";
        } else if (err.name === 'NotFoundError') {
          errorMessage = "Câmera não encontrada no dispositivo.";
        } else if (err.name === 'NotSupportedError') {
          errorMessage = "Câmera não é suportada neste navegador.";
        } else if (err.name === 'NotReadableError') {
          errorMessage = "Câmera está sendo usada por outro aplicativo.";
        }
        
        setError(errorMessage);
        toast({
          title: "Erro de câmera",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    initializeScanner();

    // Cleanup
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  const handleScanResult = (data: string) => {
    console.log("QR Code escaneado:", data);
    
    try {
      // Verificar se é uma URL válida
      const url = new URL(data);
      
      // Verificar se é uma URL do nosso app
      if (url.hostname === window.location.hostname || 
          url.hostname.includes('lovableproject.com') ||
          url.hostname.includes('lovable.app')) {
        
        // Extrair a rota da URL
        const path = url.pathname;
        
        toast({
          title: "QR Code válido!",
          description: "Redirecionando para o estabelecimento...",
        });
        
        // Fechar o scanner e navegar
        onClose();
        navigate(path);
        
      } else {
        // URL externa - abrir em nova aba
        toast({
          title: "Link externo detectado",
          description: "Abrindo link em nova aba...",
        });
        window.open(data, '_blank');
        onClose();
      }
      
    } catch (error) {
      // Se não for uma URL válida, tratar como texto
      toast({
        title: "QR Code lido",
        description: `Conteúdo: ${data}`,
      });
      console.log("Conteúdo do QR Code:", data);
    }
  };

  const handleClose = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    onClose();
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
          <CameraOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Câmera não disponível</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Verifique se você permitiu o acesso à câmera para este site.
          </p>
          <Button onClick={handleClose} className="w-full">
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Escanear QR Code</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Overlay com instruções */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-white mb-2">
          <Camera className="w-5 h-5" />
          <span className="text-sm">
            {isScanning ? "Posicione o QR Code dentro do quadro" : "Iniciando câmera..."}
          </span>
        </div>
        
        {isScanning && (
          <p className="text-xs text-gray-300">
            A leitura será automática quando o código for detectado
          </p>
        )}
      </div>

      {/* Quadro de escaneamento */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 border-2 border-white border-opacity-50 rounded-lg">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;