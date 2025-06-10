
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QRCodeGenerator = () => {
  const { toast } = useToast();
  const checkInUrl = `${window.location.origin}/check-in`;

  const handleDownloadQR = () => {
    toast({
      title: "QR Code baixado",
      description: "O QR Code foi salvo em seus downloads",
    });
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Entre na Lista de Espera',
          text: 'Escaneie este QR Code para entrar na lista de espera do restaurante',
          url: checkInUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(checkInUrl);
      toast({
        title: "Link copiado",
        description: "O link foi copiado para a área de transferência",
      });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* QR Code Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span>QR Code para Check-in</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 mb-4">
            {/* QR Code placeholder - in real app, use a QR code library */}
            <div className="w-64 h-64 mx-auto bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <QrCode className="w-16 h-16 mx-auto mb-2" />
                <p className="text-sm">QR Code</p>
                <p className="text-xs opacity-75">para Check-in</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button onClick={handleDownloadQR} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Baixar QR Code
            </Button>
            
            <Button onClick={handleShareQR} variant="outline" className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como usar o QR Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <h3 className="font-medium">Posicione o QR Code</h3>
              <p className="text-gray-600 text-sm">Coloque o QR Code em local visível na entrada do restaurante</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <h3 className="font-medium">Clientes escaneiam</h3>
              <p className="text-gray-600 text-sm">Os clientes usam a câmera do celular para escanear o código</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h3 className="font-medium">Entrada automática</h3>
              <p className="text-gray-600 text-sm">Eles são direcionados automaticamente para a página de check-in</p>
            </div>
          </div>

          <div className="border-t pt-4 mt-6">
            <h4 className="font-medium mb-2">Link direto:</h4>
            <div className="bg-gray-50 p-3 rounded border">
              <code className="text-sm text-gray-700 break-all">{checkInUrl}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
