import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";

const QRCodeGenerator = () => {
  const { toast } = useToast();
  const checkInUrl = `${window.location.origin}/check-in`;

  /* ------------------------------------------------------------
   * Download (PNG) — simples: abre a dataURL gerada pelo SVG
   * ---------------------------------------------------------- */
  const handleDownloadQR = () => {
    const svg = document.getElementById("checkin-qr");
    if (!svg) return;

    // cria um canvas temporário para converter em PNG
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "qrcode-checkin.svg";
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
   * Compartilhar / copiar link
   * ---------------------------------------------------------- */
  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Entre na Lista de Espera",
          text: "Escaneie este QR Code para entrar na lista de espera do restaurante",
          url: checkInUrl,
        });
      } catch (error) {
        console.log("Share cancelled:", error);
      }
    } else {
      await navigator.clipboard.writeText(checkInUrl);
      toast({
        title: "Link copiado!",
        description: "URL copiada para a área de transferência.",
      });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* QR Code Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-lg">QR Code Atual</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center">
          {/* QR real */}
          <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 mb-4">
            <QRCode
              id="checkin-qr"
              value={checkInUrl}
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
          <CardTitle>QR Code da Administração</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Gere, imprima e posicione este QR Code na entrada do restaurante.
            A tela da recepção é sincronizada automaticamente.
          </p>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Link direto:</h4>
            <div className="bg-gray-50 p-3 rounded border break-all text-sm">
              {checkInUrl}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
