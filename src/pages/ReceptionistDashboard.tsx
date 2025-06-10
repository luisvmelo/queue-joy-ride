
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import CurrentQueue from "@/components/CurrentQueue";
import QueueStatus from "@/components/QueueStatus";

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'qr' | 'queue' | 'status'>('status');
  const [queueData, setQueueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const restaurantId = '550e8400-e29b-41d4-a716-446655440000'; // Default restaurant

  useEffect(() => {
    fetchQueueData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parties'
        },
        () => {
          fetchQueueData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQueueData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_restaurant_queue', {
        restaurant_uuid: restaurantId
      });

      if (error) throw error;
      setQueueData(data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast({
        title: "Erro ao carregar fila",
        description: "Não foi possível carregar os dados da fila",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmArrival = async (partyId: string) => {
    try {
      const { error } = await supabase.rpc('confirm_party_arrival', {
        party_uuid: partyId
      });

      if (error) throw error;

      toast({
        title: "Chegada confirmada",
        description: "Cliente foi acomodado com sucesso",
      });
    } catch (error) {
      console.error('Error confirming arrival:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a chegada",
        variant: "destructive"
      });
    }
  };

  const handleMarkNoShow = async (partyId: string) => {
    try {
      const { error } = await supabase.rpc('mark_party_no_show', {
        party_uuid: partyId
      });

      if (error) throw error;

      toast({
        title: "Marcado como ausente",
        description: "Cliente foi marcado como não compareceu",
      });
    } catch (error) {
      console.error('Error marking no-show:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar como ausente",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da fila...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel do Recepcionista</h1>
              <p className="text-gray-600">O Cantinho Aconchegante</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
            >
              Voltar ao App
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border mb-6">
          <Button
            variant={activeTab === 'status' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('status')}
            className="flex-1"
          >
            <Clock className="w-4 h-4 mr-2" />
            Status da Fila
          </Button>
          <Button
            variant={activeTab === 'queue' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('queue')}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            Fila Completa
          </Button>
          <Button
            variant={activeTab === 'qr' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('qr')}
            className="flex-1"
          >
            <QrCode className="w-4 h-4 mr-2" />
            QR Code
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'status' && (
          <QueueStatus
            queueData={queueData}
            onConfirmArrival={handleConfirmArrival}
            onMarkNoShow={handleMarkNoShow}
          />
        )}

        {activeTab === 'queue' && (
          <CurrentQueue
            queueData={queueData}
            onConfirmArrival={handleConfirmArrival}
            onMarkNoShow={handleMarkNoShow}
          />
        )}

        {activeTab === 'qr' && (
          <QRCodeGenerator />
        )}
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
