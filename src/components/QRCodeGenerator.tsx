
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Copy, QrCode as QrCodeIcon } from 'lucide-react';

interface QRCodeGeneratorProps {
  restaurantId: string;
  restaurantName: string;
}

const QRCodeGenerator = ({ restaurantId, restaurantName }: QRCodeGeneratorProps) => {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    // Generate the QR code URL for customers to join the queue
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/check-in/${restaurantId}`;
    setQrCodeUrl(url);
  }, [restaurantId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeUrl);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive"
      });
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qr-code-${restaurantName.replace(/\s+/g, '-')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  if (!qrCodeUrl) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* QR Code Display */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <QrCodeIcon className="w-5 h-5" />
            QR Code
          </CardTitle>
          <CardDescription>
            Clientes podem escanear este código para entrar na fila
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <QRCode
              id="qr-code-svg"
              value={qrCodeUrl}
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox="0 0 256 256"
            />
          </div>
          
          <div className="flex gap-2 w-full max-w-xs">
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadQRCode}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={copyToClipboard}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como usar</CardTitle>
          <CardDescription>
            Instruções para compartilhar o QR Code com seus clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium">Imprima ou exiba o QR Code</h4>
                <p className="text-sm text-gray-600">
                  Coloque o código em local visível no seu estabelecimento
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium">Oriente os clientes</h4>
                <p className="text-sm text-gray-600">
                  Peça para escanearem o código com a câmera do celular
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium">Gerencie a fila</h4>
                <p className="text-sm text-gray-600">
                  Acompanhe e chame os clientes através deste painel
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Link direto:</h4>
            <p className="text-xs text-gray-600 break-all bg-gray-50 p-2 rounded">
              {qrCodeUrl}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
