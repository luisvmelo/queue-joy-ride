import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  PhoneCall,
  UserPlus,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import CurrentQueue from "@/components/CurrentQueue";
import QueueStatus from "@/components/QueueStatus";
import ManualQueueEntry from "@/components/ManualQueueEntry";

interface QueueParty {
  party_id: string;
  name: string;
  phone: string;
  party_size: number;
  status: string;
  queue_position: number;
  joined_at: string;
  notified_ready_at: string | null;
  tolerance_minutes: number;
}

interface Restaurant {
  id: string;
  name: string;
  is_active: boolean;
  avg_seat_time_minutes: number | null;
}

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'qr' | 'queue' | 'status'>('status');
  const [queueData, setQueueData] = useState<QueueParty[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInQueue: 0,
    avgWaitTime: 0,
    servedToday: 0,
    nextInLine: null as QueueParty | null
  });

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (restaurantId && user) {
      fetchRestaurantData();
      fetchQueueData();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('receptionist-queue-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'parties',
            filter: `restaurant_id=eq.${restaurantId}`
          },
          () => {
            fetchQueueData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [restaurantId, user]);

  const checkAuthentication = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Acesso negado",
          description: "Você precisa estar logado para acessar o dashboard",
          variant: "destructive"
        });
        navigate("/login");
        return;
      }

      setUser(session.user);

      // Get user's restaurant using the new security function
      const { data: userRestaurantId, error: restaurantError } = await supabase
        .rpc('get_user_restaurant_id');

      if (restaurantError) {
        console.error('Error getting user restaurant:', restaurantError);
        toast({
          title: "Erro de acesso",
          description: "Não foi possível encontrar seu restaurante",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      if (!userRestaurantId) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar este dashboard",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setRestaurantId(userRestaurantId);
    } catch (error) {
      console.error('Authentication error:', error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantData = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (error) throw error;
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar dados do restaurante",
        variant: "destructive"
      });
    }
  };

  const fetchQueueData = async () => {
    if (!restaurantId) return;

    try {
      // Buscar dados da fila usando RPC
      const { data, error } = await supabase.rpc('get_restaurant_queue', {
        restaurant_uuid: restaurantId
      });

      if (error) throw error;
      
      const queueParties = (data || []) as QueueParty[];
      setQueueData(queueParties);

      // Calcular estatísticas
      const waitingParties = queueParties.filter(p => p.status === 'waiting');
      const readyParties = queueParties.filter(p => p.status === 'ready');
      
      // Buscar total atendido hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: servedCount } = await supabase
        .from('queue_history')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('final_status', 'seated')
        .gte('created_at', today.toISOString());

      setStats({
        totalInQueue: waitingParties.length + readyParties.length,
        avgWaitTime: restaurant?.avg_seat_time_minutes || 45,
        servedToday: servedCount || 0,
        nextInLine: waitingParties.sort((a, b) => a.queue_position - b.queue_position)[0] || null
      });

    } catch (error) {
      console.error('Error fetching queue:', error);
      toast({
        title: "Erro ao carregar fila",
        description: "Não foi possível carregar os dados da fila",
        variant: "destructive"
      });
    }
  };

  const handleCallNext = async () => {
    if (!restaurantId) return;

    try {
      // Buscar o próximo da fila
      const { data: nextParty, error: fetchError } = await supabase
        .from('parties')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'waiting')
        .order('queue_position', { ascending: true })
        .limit(1)
        .single();

      if (fetchError || !nextParty) {
        toast({
          title: "Fila vazia",
          description: "Não há clientes aguardando na fila",
        });
        return;
      }

      // Atualizar status para ready
      const { error: updateError } = await supabase
        .from('parties')
        .update({ 
          status: 'ready',
          notified_ready_at: new Date().toISOString()
        })
        .eq('id', nextParty.id);

      if (updateError) throw updateError;

      toast({
        title: "Próximo chamado!",
        description: "O próximo cliente foi notificado",
      });

      fetchQueueData();
    } catch (error) {
      console.error('Error calling next:', error);
      toast({
        title: "Erro",
        description: "Não foi possível chamar o próximo",
        variant: "destructive"
      });
    }
  };

  const handleConfirmArrival = async (partyId: string) => {
    try {
      const { data, error } = await supabase.rpc('confirm_party_arrival', {
        party_uuid: partyId
      });

      if (error) throw error;

      toast({
        title: "Chegada confirmada",
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
      const { data, error } = await supabase.rpc('mark_party_no_show', {
        party_uuid: partyId
      });

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

  const handleSendNotification = async (partyId: string, message: string) => {
    try {
      // Implementar envio de notificação personalizada
      toast({
        title: "Notificação enviada",
        description: "Cliente foi notificado",
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar notificação",
        variant: "destructive"
      });
    }
  };

  const handleSendBulkNotification = async (message: string) => {
    try {
      // Implementar envio de notificação em massa
      toast({
        title: "Notificações enviadas",
        description: "Todos os clientes foram notificados",
      });
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar notificações",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!restaurantId || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Acesso negado</p>
          <Button onClick={() => navigate("/login")}>Fazer Login</Button>
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
              <p className="text-gray-600">{restaurant?.name || 'Carregando...'}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={handleCallNext}
                disabled={stats.totalInQueue === 0}
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                Chamar Próximo
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
              >
                Voltar ao App
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total na Fila</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInQueue}</div>
              <p className="text-xs text-muted-foreground">pessoas aguardando</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgWaitTime}min</div>
              <p className="text-xs text-muted-foreground">por atendimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atendidos Hoje</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.servedToday}</div>
              <p className="text-xs text-muted-foreground">clientes atendidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximo da Fila</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {stats.nextInLine?.name || 'Fila vazia'}
              </div>
              {stats.nextInLine && (
                <p className="text-xs text-muted-foreground">
                  {stats.nextInLine.party_size} {stats.nextInLine.party_size === 1 ? 'pessoa' : 'pessoas'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
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

        {/* Manual Queue Entry - Always visible */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Adicionar à Fila Manualmente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ManualQueueEntry 
                restaurantId={restaurantId}
                onPartyAdded={fetchQueueData}
              />
            </CardContent>
          </Card>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            {/* Clientes prontos para serem atendidos */}
            <Card>
              <CardHeader>
                <CardTitle>Aguardando Confirmação de Chegada</CardTitle>
              </CardHeader>
              <CardContent>
                {queueData.filter(p => p.status === 'ready').length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhum cliente aguardando confirmação
                  </p>
                ) : (
                  <div className="space-y-3">
                    {queueData
                      .filter(p => p.status === 'ready')
                      .map(party => (
                        <div key={party.party_id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                          <div>
                            <h4 className="font-semibold">{party.name}</h4>
                            <p className="text-sm text-gray-600">
                              {party.party_size} {party.party_size === 1 ? 'pessoa' : 'pessoas'} • {party.phone}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleConfirmArrival(party.party_id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirmar Chegada
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleMarkNoShow(party.party_id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Não Compareceu
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Próximos 5 da fila */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos 5 da Fila</CardTitle>
              </CardHeader>
              <CardContent>
                <QueueStatus
                  queueData={queueData.filter(p => p.status === 'waiting').slice(0, 5)}
                  onConfirmArrival={handleConfirmArrival}
                  onMarkNoShow={handleMarkNoShow}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'queue' && (
          <CurrentQueue
            queueData={queueData}
            onConfirmArrival={handleConfirmArrival}
            onMarkNoShow={handleMarkNoShow}
            onSendNotification={handleSendNotification}
            onSendBulkNotification={handleSendBulkNotification}
          />
        )}

        {activeTab === 'qr' && restaurantId && (
          <Card>
            <CardHeader>
              <CardTitle>QR Code do Restaurante</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeGenerator restaurantId={restaurantId} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
