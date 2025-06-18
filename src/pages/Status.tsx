/* -------------------------------------------------------------------------- */
/*  Status – posição, progresso, ETA e contagem de tolerância                */
/* -------------------------------------------------------------------------- */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, MapPin, ExternalLink } from "lucide-react";

// Extend Window interface for webkit audio context
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

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
  notified_ready_at: string | null;
  restaurant: Restaurant | null;
  restaurant_id: string | null;
}

/* -------------------------------------------------------------------------- */

const Status = () => {
  /* misc ------------------------------------------------------------------- */
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* state ------------------------------------------------------------------ */
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [waitTimeMinutes, setWaitTimeMinutes] = useState<number>(0);
  const [waitTimeSeconds, setWaitTimeSeconds] = useState<number>(0);
  const [toleranceTimeLeft, setToleranceTimeLeft] = useState<number | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  /** estado de timer ativo */
  const [isToleranceActive, setIsToleranceActive] = useState(false);

  /* modais */
  const [turnModal, setTurnModal] = useState(false);
  const [nextModal, setNextModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);

  /* refs para controle de estado */
  const previousStatus = useRef<string | null>(null);
  const isInitialLoad = useRef(true);

  /* ------------------------------------------------------------------------ */
  /*  Security: Get customer credentials from localStorage                    */
  /* ------------------------------------------------------------------------ */
  const getCustomerCredentials = () => {
    const phone = localStorage.getItem(`party_${partyId}_phone`);
    const name = localStorage.getItem(`party_${partyId}_name`);
    return { phone, name };
  };

  /* ------------------------------------------------------------------------ */
  /*  Setup inicial                                                           */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!partyId) {
      navigate("/");
      return;
    }

    // Simplified initialization without notifications

    setTimeout(() => {
      fetchPartyData();
    }, 100);

    // Try real-time subscription first
    const channel = supabase
      .channel(`party_${partyId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'parties', filter: `id=eq.${partyId}` },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          fetchPartyData();
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    // Fallback: Polling every 3 seconds if real-time fails
    // Only poll when status is 'waiting' (stops when ready/seated/etc)
    const pollingInterval = setInterval(() => {
      if (!party || party.status === 'waiting') {
        console.log('🔄 Polling for updates...');
        fetchPartyData();
      } else {
        console.log('🛑 Stopping polling - status is:', party?.status);
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
  }, [partyId, navigate]);

  /* ------------------------------------------------------------------------ */
  /*  Secure fetch party data using security definer function                */
  /* ------------------------------------------------------------------------ */
  const fetchPartyData = async () => {
    if (!partyId) {
      navigate("/");
      return;
    }

    const { phone, name } = getCustomerCredentials();
    
    if (!phone || !name) {
      setTimeout(() => {
        const { phone: retryPhone, name: retryName } = getCustomerCredentials();
        if (!retryPhone || !retryName) {
          setAccessDenied(true);
          setLoading(false);
          
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
          fetchPartyData();
        }
      }, 1000);
      return;
    }

    const sanitizedPhone = phone.replace(/[^\d+\-\s()]/g, '');
    const sanitizedName = name.replace(/[<>"/]/g, '');

    try {
      const { data, error } = await supabase
        .rpc('get_customer_party', {
          party_uuid: partyId,
          customer_phone: sanitizedPhone,
          customer_name: sanitizedName
        });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setAccessDenied(true);
        setLoading(false);
        
        toast({
          title: "Acesso negado",
          description: "Não foi possível encontrar sua reserva. Verifique se você está usando o link correto.",
          variant: "destructive"
        });
        
        setTimeout(() => navigate("/"), 3000);
        return;
      }

      const partyData = data[0];

      console.log('📊 Fetched party data:', {
        id: partyData.id,
        name: partyData.name,
        status: partyData.status,
        queue_position: partyData.queue_position,
        notified_ready_at: partyData.notified_ready_at,
        tolerance_minutes: partyData.tolerance_minutes,
        timestamp: new Date().toISOString()
      });

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
        notified_ready_at: partyData.notified_ready_at,
        restaurant: {
          id: partyData.restaurant_id,
          name: partyData.restaurant_name,
          menu_url: partyData.restaurant_menu_url,
          avg_seat_time_minutes: partyData.restaurant_avg_seat_time_minutes
        },
        restaurant_id: partyData.restaurant_id
      });

      setAccessDenied(false);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar dados da fila",
        variant: "destructive"
      });
      
      setAccessDenied(true);
      setTimeout(() => navigate("/"), 3000);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Wait Time Countdown (when waiting in queue)                            */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!party || party.status === 'ready') return;

    const calculateWaitTime = () => {
      const avgTime = party.restaurant?.avg_seat_time_minutes || 45;
      const position = party.queue_position || 0;
      
      if (position <= 0) {
        setWaitTimeMinutes(0);
        setWaitTimeSeconds(0);
        return;
      }
      
      // Calculate estimated wait time in minutes
      const estimatedMinutes = position * avgTime;
      setWaitTimeMinutes(Math.floor(estimatedMinutes));
      setWaitTimeSeconds(0);
    };

    calculateWaitTime();
  }, [party]);

  /* ------------------------------------------------------------------------ */
  /*  Wait Time Countdown Timer                                               */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!party || party.status === 'ready' || waitTimeMinutes <= 0) return;

    const interval = setInterval(() => {
      setWaitTimeSeconds(prev => {
        if (prev > 0) {
          return prev - 1;
        } else if (waitTimeMinutes > 0) {
          setWaitTimeMinutes(prev => prev - 1);
          return 59;
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [waitTimeMinutes, waitTimeSeconds, party?.status]);

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
  /*  Tolerance Timer (when status is ready)                                 */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!party) return;

    if (party.status === 'ready' && party.notified_ready_at) {
      // Calculate time left based on notified_ready_at timestamp (same as receptionist)
      const toleranceMinutes = party.tolerance_minutes || 5; // From get_restaurant_queue function
      const totalToleranceSeconds = (toleranceMinutes * 60) + 30; // Restaurant time + 30s safety margin
      
      const notifiedTime = new Date(party.notified_ready_at).getTime();
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - notifiedTime) / 1000);
      const remainingSeconds = Math.max(0, totalToleranceSeconds - elapsedSeconds);
      
      console.log('⏰ Syncing tolerance timer with notified_ready_at:', {
        notifiedAt: party.notified_ready_at,
        toleranceMinutes,
        totalToleranceSeconds,
        elapsedSeconds,
        remainingSeconds,
        formattedRemaining: `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`
      });
      
      setToleranceTimeLeft(remainingSeconds);
      setIsToleranceActive(true);
      
      // If time already expired, trigger no-show immediately
      if (remainingSeconds <= 0) {
        console.log('⏰ Timer already expired, triggering no-show');
        handleNoShow();
      }
    } else {
      setToleranceTimeLeft(null);
      setIsToleranceActive(false);
    }
  }, [party?.status, party?.notified_ready_at, party?.tolerance_minutes]);

  useEffect(() => {
    if (!isToleranceActive || toleranceTimeLeft === null || toleranceTimeLeft <= 0) return;

    const interval = setInterval(() => {
      setToleranceTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleNoShow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [toleranceTimeLeft, isToleranceActive]);

  /* ------------------------------------------------------------------------ */
  /*  Status Change Detection                                                 */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!party || isInitialLoad.current) {
      if (party) isInitialLoad.current = false;
      return;
    }

    const currentStatus = party.status;

    // Debug logging
    console.log('🔎 Status check:', {
      currentStatus,
      previousStatus: previousStatus.current,
    });

    // Ready notification - when receptionist calls you
    if (currentStatus === 'ready' && previousStatus.current !== 'ready') {
      console.log('🎉 Your turn! Status changed to ready');
      setTurnModal(true);
      
      // Show prominent toast notification
      toast({
        title: "🎉 É sua vez!",
        description: `Sua mesa no ${party.restaurant?.name || 'restaurante'} está pronta! Dirija-se ao local.`,
        duration: 10000,
      });
    }

    previousStatus.current = currentStatus;
  }, [party?.status]);

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
          party_uuid: partyId,
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
      console.log('⏰ Timeout reached - marking party as no-show:', party.id);
      
      // Update party status to no_show and set removed_at
      const { error } = await supabase
        .from('parties')
        .update({ 
          status: 'no_show',
          removed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', party.id);

      if (error) {
        console.error('Error marking no-show:', error);
        return;
      }

      console.log('✅ Party marked as no-show successfully');
      setNoShowOpen(true);
    } catch (error) {
      console.error('Erro ao processar no-show:', error);
    }
  };

  const handleRejoinQueue = async () => {
    if (!party?.restaurant_id) return;
    
    navigate(`/check-in/${party.restaurant_id}`);
  };

  // Removed notification functions - keeping only SMS/WhatsApp

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

  const formatEstimatedTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatWaitTime = (): string => {
    return `${waitTimeMinutes}:${waitTimeSeconds.toString().padStart(2, '0')}`;
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

              {/* Tempo de Espera / Status */}
              {party.status === 'waiting' && waitTimeMinutes > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-lg mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Tempo estimado de espera:</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 text-center">
                    {formatWaitTime()}
                  </div>
                  <p className="text-sm text-blue-600 text-center mt-1">minutos:segundos</p>
                </div>
              ) : party.status === 'ready' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-lg mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">🎉 Mesa pronta agora!</span>
                  </div>
                  <p className="text-sm text-green-700 text-center">
                    Dirija-se ao restaurante o quanto antes!
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span>Aguardando atualização...</span>
                </div>
              )}

              {/* Timer de Tolerância */}
              {console.log('🔍 Timer visibility check:', {
                isToleranceActive,
                toleranceTimeLeft,
                shouldShow: isToleranceActive && toleranceTimeLeft !== null && toleranceTimeLeft > 0,
                partyStatus: party.status
              })}
              {isToleranceActive && toleranceTimeLeft !== null && toleranceTimeLeft > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-red-600 font-semibold mb-2">
                      ⏰ Tempo para chegar ao restaurante:
                    </div>
                    <div className="text-4xl font-bold text-red-600">
                      {formatTime(toleranceTimeLeft)}
                    </div>
                    <p className="text-sm text-red-500 mt-2">
                      Dirija-se ao restaurante agora! Se não chegar a tempo, será removido da fila.
                    </p>
                  </div>
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
            variant="destructive"
            onClick={() => setLeaveModal(true)}
            className="w-full"
          >
            Sair da Fila
          </Button>
        </div>
      </div>

      {/* Removed audio notifications */}

      {/* Modais */}
      <TurnNotificationModal
        isOpen={turnModal}
        onConfirm={() => setTurnModal(false)}
        onCancel={() => setTurnModal(false)}
        restaurantName={party.restaurant?.name ?? ""}
        toleranceTimeLeft={0} // Remove timer from modal, main screen shows it
      />

      {/* Removed next in line modal */}

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