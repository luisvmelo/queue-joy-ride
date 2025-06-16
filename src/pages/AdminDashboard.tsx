import QueueAnalytics from "@/components/QueueAnalytics";
import { useEffect, useState } from "react";
import EventManager from "@/components/EventManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Users, Clock, Settings, QrCode, Download } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type Party = Database['public']['Tables']['parties']['Row'];

// Interface estendida para incluir campos que podem não estar nos tipos
interface ExtendedRestaurant extends Restaurant {
  current_event?: string;
  event_type?: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<ExtendedRestaurant | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      const unsubscribe = setupRealtimeSubscription();
      return () => {
        unsubscribe?.();
      };
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      navigate("/login");
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar restaurante do usuário
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (restaurantError) {
        if (restaurantError.code === 'PGRST116') {
          // Nenhum restaurante encontrado
          toast({
            title: "Bem-vindo!",
            description: "Vamos cadastrar seu restaurante.",
          });
          navigate("/register");
          return;
        }
        throw restaurantError;
      }

      setRestaurant(restaurantData);

      // Gerar URL do QR Code
      const baseUrl = window.location.origin;
      const qrUrl = `${baseUrl}/check-in/${restaurantData.id}`;
      setQrCodeUrl(qrUrl);

      // Buscar filas ativas do restaurante
      const { data: partiesData, error: partiesError } = await supabase
        .from('parties')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .in('status', ['waiting', 'next', 'ready'])
        .order('queue_position', { ascending: true });

      if (partiesError) {
        console.error('Erro ao buscar filas:', partiesError);
        toast({
          title: "Erro",
          description: "Erro ao carregar fila de espera",
          variant: "destructive"
        });
      } else {
        setParties(partiesData || []);
      }

    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!restaurant?.id) return;

    const subscription = supabase
      .channel(`parties-${restaurant.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'parties',
          filter: `restaurant_id=eq.${restaurant.id}`
        },
        (payload) => {
          console.log('Realtime update:', payload);
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive"
      });
    }
  };

  const toggleQueueStatus = async () => {
    if (!restaurant) return;
    
    try {
      const newStatus = !restaurant.is_active;
      
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: newStatus })
        .eq('id', restaurant.id);

      if (error) throw error;

      setRestaurant({ ...restaurant, is_active: newStatus });
      
      toast({
        title: newStatus ? "Fila aberta!" : "Fila fechada!",
        description: newStatus 
          ? "Os clientes agora podem entrar na fila." 
          : "A fila foi fechada para novos clientes."
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap = {
      waiting: { label: "Aguardando", variant: "default" as const },
      next: { label: "Próximo", variant: "secondary" as const },
      ready: { label: "Mesa Pronta", variant: "destructive" as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status || 'Desconhecido', 
      variant: "outline" as const 
    };
    
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getWaitTime = (joinedAt: string | null) => {
    if (!joinedAt) return '0min';
    const diff = Date.now() - new Date(joinedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes}min`;
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

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="mb-4">Restaurante não encontrado</p>
            <Button onClick={() => navigate("/register")}>
              Cadastrar Restaurante
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
              <p className="text-gray-600">Painel Administrativo</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowQRDialog(true)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/admin/settings`)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Stats and Queue */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total na Fila
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{parties.length}</div>
                  <p className="text-xs text-muted-foreground">
                    clientes aguardando
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tempo Médio
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {restaurant.avg_seat_time_minutes || 45}min
                  </div>
                  <p className="text-xs text-muted-foreground">
                    por atendimento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Status da Fila
                  </CardTitle>
                  <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                    {restaurant.is_active ? "Aberta" : "Fechada"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="sm" 
                    variant={restaurant.is_active ? "destructive" : "default"}
                    onClick={toggleQueueStatus}
                    className="w-full"
                  >
                    {restaurant.is_active ? 'Fechar Fila' : 'Abrir Fila'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Current Queue */}
            <Card>
              <CardHeader>
                <CardTitle>Fila Atual</CardTitle>
                <CardDescription>
                  Clientes aguardando atendimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parties.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Nenhum cliente na fila</p>
                    <p className="text-sm mt-2">
                      Os clientes que escanearem o QR Code aparecerão aqui
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {parties.map((party, index) => (
                      <div 
                        key={party.id} 
                        className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl font-bold text-gray-400">
                            #{party.queue_position || index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{party.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              <span>{party.party_size} {party.party_size === 1 ? 'pessoa' : 'pessoas'}</span>
                              <span>•</span>
                              <span>{getWaitTime(party.joined_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(party.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Queue Analytics */}
            <QueueAnalytics restaurantId={restaurant.id} />

            {/* Event Manager */}
            <EventManager
              restaurantId={restaurant.id}
              currentEvent={restaurant.current_event}
              eventType={restaurant.event_type}
              onUpdate={loadDashboardData}
            />
          </div>

          {/* Right Column - Restaurant Info & Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Restaurante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nome</p>
                  <p className="text-gray-900">{restaurant.name}</p>
                </div>
                {restaurant.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Descrição</p>
                    <p className="text-gray-900">{restaurant.description}</p>
                  </div>
                )}
                {restaurant.address && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Endereço</p>
                    <p className="text-gray-900">{restaurant.address}</p>
                  </div>
                )}
                {restaurant.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Telefone</p>
                    <p className="text-gray-900">{restaurant.phone}</p>
                  </div>
                )}
                {restaurant.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{restaurant.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant={restaurant.is_active ? "destructive" : "default"}
                  onClick={toggleQueueStatus}
                  className="w-full"
                >
                  {restaurant.is_active ? 'Fechar Fila' : 'Abrir Fila'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowQRDialog(true)}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Visualizar QR Code
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/admin/history')}
                >
                  Ver Histórico
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code do Restaurante</DialogTitle>
            <DialogDescription>
              Os clientes podem escanear este código para entrar na fila
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div id="qr-code-canvas" className="bg-white p-4 rounded-lg">
              {showQRDialog && (
                <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">QR Code aqui</p>
                </div>
              )}
            </div>
            <p className="text-sm text-center text-gray-600 break-all">
              {qrCodeUrl}
            </p>
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  toast({
                    title: "Em desenvolvimento",
                    description: "Função de download será implementada em breve"
                  });
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
              <Button 
                variant="default" 
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(qrCodeUrl);
                  toast({
                    title: "Link copiado!",
                    description: "O link foi copiado para a área de transferência."
                  });
                }}
              >
                Copiar Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;