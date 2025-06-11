
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";

interface QRCodeGeneratorProps {
  restaurantId?: string;
  restaurantName?: string;
}

const QRCodeGenerator = ({ restaurantId, restaurantName }: QRCodeGeneratorProps) => {
  const { toast } = useToast();
  
  // Se restaurantId for fornecido, gera URL específica do restaurante
  const targetUrl = restaurantId 
    ? `${window.location.origin}/estabelecimento/${restaurantId}`
    : `${window.location.origin}/check-in`;

  const qrTitle = restaurantId && restaurantName
    ? `QR Code - ${restaurantName}`
    : "QR Code - Check-in Geral";

  /* ------------------------------------------------------------
   * Download (PNG) — simples: abre a dataURL gerada pelo SVG
   * ---------------------------------------------------------- */
  const handleDownloadQR = () => {
    const svg = document.getElementById(restaurantId ? `restaurant-qr-${restaurantId}` : "checkin-qr");
    if (!svg) return;

    // cria um canvas temporário para converter em PNG
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode-${restaurantId || 'checkin'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "QR Code baixado!",
      description: "Arquivo SVG salvo nos seus downloads.",
    });
  };

  /* ------------------------------------------------------------
   * Copiar link
   * ---------------------------------------------------------- */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      toast({
        title: "Link copiado!",
        description: "URL copiada para a área de transferência.",
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  /* ------------------------------------------------------------
   * Compartilhar / copiar link
   * ---------------------------------------------------------- */
  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Entre na Lista de Espera",
          text: `Escaneie este QR Code para entrar na lista de espera${restaurantName ? ` do ${restaurantName}` : ''}`,
          url: targetUrl,
        });
      } catch (error) {
        console.log("Share cancelled:", error);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* QR Code Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-lg">{qrTitle}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center">
          {/* QR real */}
          <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 mb-4">
            <QRCode
              id={restaurantId ? `restaurant-qr-${restaurantId}` : "checkin-qr"}
              value={targetUrl}
              size={256}
              bgColor="#ffffff"
              fgColor="#000000"
              style={{ margin: "0 auto", width: "16rem", height: "16rem" }}
            />
          </div>

          <div className="space-y-3">
            <Button onClick={handleDownloadQR} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Baixar QR Code
            </Button>

            <Button onClick={handleCopyLink} variant="outline" className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Copiar Link
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
          <CardTitle>
            {restaurantId && restaurantName ? `QR Code - ${restaurantName}` : "QR Code da Administração"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            {restaurantId && restaurantName 
              ? `Gere, imprima e posicione este QR Code na entrada do ${restaurantName}. Os clientes podem escanear para acessar diretamente as opções do estabelecimento.`
              : "Gere, imprima e posicione este QR Code na entrada do restaurante. A tela da recepção é sincronizada automaticamente."
            }
          </p>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Link direto:</h4>
            <div className="bg-gray-50 p-3 rounded border break-all text-sm">
              {targetUrl}
            </div>
          </div>

          {restaurantId && restaurantName && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Funcionalidades disponíveis:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Entrar na fila</li>
                <li>• Ver menu do estabelecimento</li>
                <li>• Fazer reserva</li>
                <li>• Visualizar tempo de espera atual</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
