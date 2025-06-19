import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, PhoneCall, Users, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import ManualQueueEntry from "@/components/ManualQueueEntry";

const SimpleReceptionistDashboard = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [queueData, setQueueData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalInQueue: 0,
    averageWaitTime: 0,
    servedToday: 0
  });
  const [activeTab, setActiveTab] = useState<string>('queue');

  const fetchQueueData = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .in('status', ['waiting', 'called'])
        .order('queue_position', { ascending: true });

      if (error) throw error;
      
      setQueueData(data || []);
      
      // Calculate stats
      const waiting = data?.filter(p => p.status === 'waiting') || [];
      const totalToday = await supabase
        .from('parties')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', new Date().toISOString().split('T')[0]);

      setStats({
        totalInQueue: waiting.length,
        averageWaitTime: 15, // Mock value
        servedToday: totalToday.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching queue data:', error);
    }
  };

  const handleCallNext = async () => {
    if (!restaurantId) return;

    try {
      const { data: nextParty, error } = await supabase
        .from('parties')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'waiting')
        .order('queue_position', { ascending: true })
        .limit(1)
        .single();

      if (error || !nextParty) {
        toast({
          title: "Fila vazia",
          description: "Não há clientes aguardando na fila",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('parties')
        .update({ 
          status: 'called',
          called_at: new Date().toISOString()
        })
        .eq('id', nextParty.id);

      if (updateError) throw updateError;

      toast({
        title: "Próximo chamado! 📞",
        description: `${nextParty.name} foi chamado`,
      });

      fetchQueueData();
    } catch (error) {
      console.error('Error calling next:', error);
      toast({
        title: "Erro",
        description: "Erro ao chamar próximo cliente",
        variant: "destructive"
      });
    }
  };

  const handleConfirmArrival = async (partyId: string) => {
    try {
      const { error } = await supabase
        .from('parties')
        .update({ 
          status: 'seated',
          seated_at: new Date().toISOString()
        })
        .eq('id', partyId);

      if (error) throw error;

      toast({
        title: "Chegada confirmada ✅",
        description: "Cliente foi acomodado com sucesso",
      });
      
      fetchQueueData();
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
      const { error } = await supabase
        .from('parties')
        .update({ 
          status: 'no_show',
          removed_at: new Date().toISOString()
        })
        .eq('id', partyId);

      if (error) throw error;

      toast({
        title: "Marcado como ausente",
        description: "Cliente foi marcado como não compareceu",
      });
      
      fetchQueueData();
    } catch (error) {
      console.error('Error marking no-show:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar como ausente",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = () => {
    toast({
      title: "Sessão encerrada",
      description: "Você foi desconectado com sucesso",
    });
    window.location.href = '/receptionist-login';
  };

  useEffect(() => {
    const validateAndLoad = async () => {
      if (!restaurantId) {
        toast({
          title: "Erro",
          description: "ID do restaurante não fornecido",
          variant: "destructive"
        });
        window.location.href = '/receptionist-login';
        return;
      }

      try {
        // Verificar se o restaurante existe e está ativo
        const { data: restaurantData, error } = await supabase
          .from('restaurants')
          .select('id, name, is_active')
          .eq('id', restaurantId)
          .single();

        if (error || !restaurantData?.is_active) {
          console.error('Restaurant validation failed:', { error, restaurantData });
          toast({
            title: "Acesso negado",
            description: "Restaurante não encontrado ou inativo",
            variant: "destructive"
          });
          window.location.href = '/receptionist-login';
          return;
        }

        setRestaurant(restaurantData);
        console.log('✅ Receptionist access validated for restaurant:', restaurantData.name);
        
        // Carregar dados da fila
        await fetchQueueData();
        
      } catch (error) {
        console.error('Error validating restaurant:', error);
        toast({
          title: "Erro de validação",
          description: "Erro ao validar acesso ao restaurante",
          variant: "destructive"
        });
        window.location.href = '/receptionist-login';
      } finally {
        setLoading(false);
      }
    };

    validateAndLoad();
  }, [restaurantId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-center text-gray-600">Carregando painel da recepção...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso negado</h2>
          <p className="text-gray-600">Restaurante não encontrado</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Painel da Recepção</h1>
              <p className="text-gray-600 flex items-center gap-2">
                {restaurant.name}
                <span className="flex items-center gap-1 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  <Users className="w-3 h-3" />
                  {stats.totalInQueue} na fila
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={handleCallNext}
                disabled={stats.totalInQueue === 0}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 text-base"
              >
                <PhoneCall className="w-5 h-5 mr-2" />
                Chamar Próximo
                {stats.totalInQueue > 0 && (
                  <span className="ml-2 bg-white text-green-600 px-2 py-1 rounded-full text-sm font-bold">
                    {stats.totalInQueue}
                  </span>
                )}
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/"}>
                Voltar ao App
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Na Fila</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInQueue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Atendidos Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.servedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <PhoneCall className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageWaitTime}min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'queue', label: 'Gerenciar Fila' },
                { id: 'manual', label: 'Adicionar Cliente' },
                { id: 'qr', label: 'QR Code' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'queue' && (
          <Card>
            <CardHeader>
              <CardTitle>Fila de Espera</CardTitle>
            </CardHeader>
            <CardContent>
              {queueData.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum cliente na fila</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queueData.map((party, index) => (
                    <div key={party.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">{index + 1}</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{party.name}</p>
                          <p className="text-sm text-gray-500">
                            {party.party_size} pessoa(s) • {party.phone}
                          </p>
                          {party.status === 'called' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Chamado
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {party.status === 'called' && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmArrival(party.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Chegou
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkNoShow(party.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Ausente
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Adicionar à Fila Manualmente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ManualQueueEntry 
                restaurantId={restaurantId!}
                onPartyAdded={fetchQueueData}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'qr' && (
          <QRCodeGenerator 
            restaurantId={restaurantId!} 
            restaurantName={restaurant.name}
          />
        )}
      </div>
    </div>
  );
};

export default SimpleReceptionistDashboard;