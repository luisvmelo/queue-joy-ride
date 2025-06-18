/* -------------------------------------------------------------------------- */
/*  Status – posição, progresso, ETA e contagem de tolerância                */
/* -------------------------------------------------------------------------- */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Bell, BellOff, Clock, Users, MapPin, ExternalLink } from "lucide-react";

import TurnNotificationModal from "@/components/TurnNotificationModal";
import LeaveQueueConfirmation from "@/components/LeaveQueueConfirmation";
import ThankYouScreen from "@/components/ThankYouScreen";
import NoShowScreen from "@/components/NoShowScreen";
import TimeCounter from "@/components/TimeCounter";

import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
interface Restaurant {
  id: string;
  name: string;
  menu_url: string | null;
  avg_seat_time_minutes: number | null;
}

interface Party {
  id: string;
  name: string;
  phone: string;
  party_size: number;
  queue_position: number | null;
  initial_position: number | null;
  estimated_wait_minutes: number | null;
  tolerance_minutes: number | null;
  joined_at: string | null;
  status: string | null;
  restaurant: Restaurant | null;
  restaurant_id: string | null;
}

/* -------------------------------------------------------------------------- */

const Status = () => {
  /* misc ------------------------------------------------------------------- */
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* state ------------------------------------------------------------------ */
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [betterEstimatedTime, setBetterEstimatedTime] = useState<number | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  /** cronômetro da tolerância (segundos) */
  const [toleranceLeft, setToleranceLeft] = useState<number | null>(null);

  /* modais */
  const [turnModal, setTurnModal] = useState(false);
  const [nextModal, setNextModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);

  /* refs para controle de notificações */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasNotifiedNext = useRef(false);
  const hasNotifiedReady = useRef(false);
  const previousStatus = useRef<string | null>(null);
  const previousPosition = useRef<number | null>(null);
  const isInitialLoad = useRef(true);

  /* ------------------------------------------------------------------------ */
  /*  Security: Get customer credentials from localStorage                    */
  /* ------------------------------------------------------------------------ */
  const getCustomerCredentials = () => {
    const phone = localStorage.getItem(`party_${id}_phone`);
    const name = localStorage.getItem(`party_${id}_name`);
    
    console.log('🔐 Getting customer credentials:', {
      party_id: id,
      phone: phone ? 'EXISTS' : 'NOT_FOUND',
      name: name ? 'EXISTS' : 'NOT_FOUND',
      phoneKey: `party_${id}_phone`,
      nameKey: `party_${id}_name`
    });
    
    // Logs para debug das chaves do localStorage
    const allKeys = Object.keys(localStorage);
    const partyKeys = allKeys.filter(key => key.startsWith('party_'));
    console.log('🗃️ All party keys in localStorage:', partyKeys);
    
    return { phone, name };
  };

  /* ------------------------------------------------------------------------ */
  /*  Setup inicial                                                           */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    console.log('🎯 Status page useEffect triggered with ID:', id);
    
    if (!id) {
      console.log('❌ No ID in URL params, redirecting to home');
      navigate("/");
      return;
    }

    // Delay pequeno para garantir que o localStorage foi populado
    setTimeout(() => {
      fetchPartyData();
    }, 100);

    // Configurar realtime subscription
    const channel = supabase
      .channel(`party_${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'parties', filter: `id=eq.${id}` },
        (payload) => {
          console.log('🔄 Party updated via realtime:', payload);
          fetchPartyData();
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [id, navigate]);

  /* ------------------------------------------------------------------------ */
  /*  Secure fetch party data using security definer function                */
  /* ------------------------------------------------------------------------ */
  const fetchPartyData = async () => {
    if (!id) {
      console.log('❌ No party ID provided');
      navigate("/");
      return;
    }

    console.log('🔄 Fetching party data for ID:', id);

    const { phone, name } = getCustomerCredentials();
    
    if (!phone || !name) {
      console.log('❌ Missing credentials:', { phone: !!phone, name: !!name });
      
      // Dar mais tempo para verificar se as credenciais aparecerão
      // (caso estejam sendo definidas assincronamente)
      setTimeout(() => {
        const { phone: retryPhone, name: retryName } = getCustomerCredentials();
        if (!retryPhone || !retryName) {
          console.log('❌ Credentials still missing after retry, denying access');
          setAccessDenied(true);
          setLoading(false);
          
          // Redirecionar para home após mostrar erro
          setTimeout(() => {
            toast({
              title: "Acesso negado",
              description: "Credenciais de acesso não encontradas. Escaneie o QR code novamente.",
              variant: "destructive"
            });
            navigate("/");
          }, 1000);
          
          return;
        } else {
          console.log('✅ Credentials found on retry, proceeding...');
          // Recursivamente tentar novamente com as credenciais encontradas
          fetchPartyData();
        }
      }, 1000);
      return;
    }

    // Sanitizar entradas para prevenir XSS
    const sanitizedPhone = phone.replace(/[^\d+\-\s()]/g, '');
    const sanitizedName = name.replace(/[<>"/]/g, '');

    console.log('🧹 Sanitized credentials:', {
      originalPhone: phone,
      sanitizedPhone: sanitizedPhone,
      originalName: name,
      sanitizedName: sanitizedName
    });

    try {
      console.log('📡 Calling get_customer_party with:', {
        party_uuid: id,
        customer_phone: sanitizedPhone,
        customer_name: sanitizedName
      });

      const { data, error } = await supabase
        .rpc('get_customer_party', {
          party_uuid: id,
          customer_phone: sanitizedPhone,
          customer_name: sanitizedName
        });

      console.log('📥 get_customer_party response:', { data, error });

      if (error) {
        console.error('❌ Supabase RPC error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('❌ No party found with provided credentials');
        setAccessDenied(true);
        setLoading(false);
        
        toast({
          title: "Acesso negado",
          description: "Não foi possível encontrar sua reserva. Verifique se você está usando o link correto.",
          variant: "destructive"
        });
        
        // Redirecionar para home após 3 segundos
        setTimeout(() => navigate("/"), 3000);
        return;
      }

      const partyData = data[0];
      console.log('✅ Party data retrieved successfully:', partyData);

      setParty({
        id: partyData.id,
        name: partyData.name,
        phone: partyData.phone,
        party_size: partyData.party_size,
        queue_position: partyData.queue_position,
        initial_position: partyData.initial_position,
        estimated_wait_minutes: partyData.estimated_wait_minutes,
        tolerance_minutes: partyData.tolerance_minutes,
        joined_at: partyData.joined_at,
        status: partyData.status,
        restaurant: {
          id: partyData.restaurant_id,
          name: partyData.restaurant_name,
          menu_url: partyData.restaurant_menu_url,
          avg_seat_time_minutes: partyData.restaurant_avg_seat_time_minutes
        },
        restaurant_id: partyData.restaurant_id
      });

      setAccessDenied(false);
      console.log('✅ Party state updated successfully');

    } catch (error: any) {
      console.error('💥 Error fetching party data:', error);
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar dados da fila",
        variant: "destructive"
      });
      
      setAccessDenied(true);
      
      // Redirecionar para home em caso de erro
      setTimeout(() => navigate("/"), 3000);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Better Time Estimation                                                  */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!party) return;

    const calculateBetterEstimate = () => {
      const avgTime = party.restaurant?.avg_seat_time_minutes || 45;
      const position = party.queue_position || 0;
      
      if (position <= 0) {
        setBetterEstimatedTime(0);
        return;
      }
      
      // Estimativa mais realista baseada na posição e tempo médio
      const baseWait = position * avgTime;
      const variance = Math.random() * 10 - 5; // ±5 min
      setBetterEstimatedTime(Math.max(0, Math.round(baseWait + variance)));
    };

    calculateBetterEstimate();
  }, [party]);

  /* ------------------------------------------------------------------------ */
  /*  Elapsed time counter                                                    */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!party?.joined_at) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(party.joined_at!).getTime()) / 60000);
      setElapsedMinutes(elapsed);
    }, 60000);

    return () => clearInterval(interval);
  }, [party?.joined_at]);

  /* ------------------------------------------------------------------------ */
  /*  Tolerância – inicia contagem quando status é ready                      */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!party) return;

    if (party.status === 'ready' || party.queue_position === 0) {
      const toleranceMinutes = party.tolerance_minutes || 10;
      setToleranceLeft(toleranceMinutes * 60);
    } else {
      setToleranceLeft(null);
    }
  }, [party?.status, party?.queue_position, party?.tolerance_minutes]);

  useEffect(() => {
    if (toleranceLeft === null || toleranceLeft <= 0) return;

    const interval = setInterval(() => {
      setToleranceLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleNoShow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [toleranceLeft]);

  /* ------------------------------------------------------------------------ */
  /*  Notification Logic                                                      */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!party || isInitialLoad.current) {
      if (party) isInitialLoad.current = false;
      return;
    }

    const currentStatus = party.status;
    const currentPosition = party.queue_position;

    // Next in line notification
    if (currentPosition === 1 && previousPosition.current !== 1 && !hasNotifiedNext.current) {
      setNextModal(true);
      hasNotifiedNext.current = true;
      playNotificationSound();
    }

    // Ready notification
    if (currentStatus === 'ready' && previousStatus.current !== 'ready' && !hasNotifiedReady.current) {
      setTurnModal(true);
      hasNotifiedReady.current = true;
      playNotificationSound();
    }

    previousStatus.current = currentStatus;
    previousPosition.current = currentPosition;
  }, [party?.status, party?.queue_position]);

  /* ------------------------------------------------------------------------ */
  /*  Handlers                                                                */
  /* ------------------------------------------------------------------------ */
  const handleLeaveQueue = async () => {
    try {
      const { phone, name } = getCustomerCredentials();
      
      if (!phone || !name) {
        toast({
          title: "Erro",
          description: "Credenciais de acesso não encontradas",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .rpc('update_customer_party_status', {
          party_uuid: id,
          customer_phone: phone,
          new_status: 'removed'
        });

      if (error) throw error;

      setLeaveModal(false);
      setThanksOpen(true);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao sair da fila",
        variant: "destructive"
      });
    }
  };

  const handleNoShow = async () => {
    if (!party) return;
    
    try {
      await supabase.rpc('mark_party_no_show', { party_uuid: party.id });
      setNoShowOpen(true);
    } catch (error) {
      console.error('Erro ao processar no-show:', error);
    }
  };

  const handleRejoinQueue = async () => {
    if (!party?.restaurant_id) return;
    
    navigate(`/check-in/${party.restaurant_id}`);
  };

  const playNotificationSound = () => {
    if (audioRef.current && notificationsEnabled) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Helpers                                                                 */
  /* ------------------------------------------------------------------------ */
  const progress = (() => {
    if (!party || party.initial_position == null) return 0;
    if (party.initial_position === 0) return 100;
    const current = party.queue_position ?? 0;
    const initial = party.initial_position;
    const completed = initial - current;
    return Math.min(100, Math.max(0, (completed / initial) * 100));
  })();

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatToleranceTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /* ------------------------------------------------------------------------ */
  /*  Loading State                                                           */
  /* ------------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da fila...</p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*  Access Denied State                                                     */
  /* ------------------------------------------------------------------------ */
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Não foi possível verificar seu acesso a esta fila.
            </p>
            <p className="text-sm text-gray-500">
              Certifique-se de que você está usando o link correto enviado pelo restaurante.
            </p>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*  No Party State                                                          */
  /* ------------------------------------------------------------------------ */
  if (!party) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Fila não encontrada</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Não foi possível encontrar informações sobre sua posição na fila.
            </p>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*  Main Render                                                             */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              {party.restaurant?.name}
            </CardTitle>
            <CardDescription>
              {party.name} • {party.party_size} {party.party_size === 1 ? 'pessoa' : 'pessoas'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Status Principal */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              
              {/* Posição na Fila */}
              <div>
                <div className="text-4xl font-bold text-orange-600">
                  {party.queue_position === 0 ? "Sua vez!" : party.queue_position || '—'}
                </div>
                <p className="text-gray-600">
                  {party.queue_position === 0 ? "🎉 Mesa pronta!" : "Posição na fila"}
                </p>
              </div>

              {/* Progress Bar */}
              {party.initial_position && party.initial_position > 0 && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-gray-500">
                    {Math.round(progress)}% completo • 
                    {party.initial_position - (party.queue_position || 0)} de {party.initial_position} atendidos
                  </p>
                </div>
              )}

              {/* Tempo Estimado */}
              <div className="flex items-center justify-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-gray-500" />
                <span>
                  {party.queue_position === 0 
                    ? "Mesa disponível agora!" 
                    : betterEstimatedTime !== null 
                      ? `~${formatTime(betterEstimatedTime)}`
                      : "Calculando..."
                  }
                </span>
              </div>

              {/* Cronômetro de Tolerância */}
              {toleranceLeft !== null && toleranceLeft > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-red-600 font-semibold">
                    ⏰ Mesa reservada por: {formatToleranceTime(toleranceLeft)}
                  </div>
                  <p className="text-sm text-red-500 mt-1">
                    Dirija-se ao restaurante o quanto antes
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Na fila há {elapsedMinutes} {elapsedMinutes === 1 ? 'minuto' : 'minutos'}
              </span>
            </div>
            
            {party.restaurant?.menu_url && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(party.restaurant!.menu_url!, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Cardápio
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Controles */}
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={requestNotificationPermission}
            className="w-full"
            disabled={notificationsEnabled}
          >
            {notificationsEnabled ? (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Notificações Ativadas
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 mr-2" />
                Ativar Notificações
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            onClick={() => setLeaveModal(true)}
            className="w-full"
          >
            Sair da Fila
          </Button>
        </div>
      </div>

      {/* Audio para notificações */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
        <source src="/notification-sound.wav" type="audio/wav" />
      </audio>

      {/* Modais */}
      <TurnNotificationModal
        isOpen={turnModal}
        onConfirm={() => setTurnModal(false)}
        onCancel={() => setTurnModal(false)}
        restaurantName={party.restaurant?.name ?? ""}
        toleranceTimeLeft={toleranceLeft ?? (party.tolerance_minutes ?? 10) * 60}
      />

      <TurnNotificationModal
        isOpen={nextModal}
        onConfirm={() => setNextModal(false)}
        onCancel={() => setNextModal(false)}
        restaurantName={party.restaurant?.name ?? ""}
        toleranceTimeLeft={toleranceLeft ?? (party.tolerance_minutes ?? 10) * 60}
        isNextInLine={true}
      />

      <LeaveQueueConfirmation
        isOpen={leaveModal}
        onCancel={() => setLeaveModal(false)}
        onConfirm={handleLeaveQueue}
        restaurantName={party.restaurant?.name ?? ""}
      />

      <ThankYouScreen
        isOpen={thanksOpen}
        onJoinAgain={() => navigate(`/check-in/${party.restaurant_id}`)}
        restaurantName={party.restaurant?.name ?? ""}
      />

      <NoShowScreen
        isOpen={noShowOpen}
        onRejoinQueue={handleRejoinQueue}
        newPosition={50} // Vai para o final da fila
        restaurantName={party.restaurant?.name ?? ""}
      />
    </div>
  );
};

export default Status;