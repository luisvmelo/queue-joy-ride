/* -------------------------------------------------------------------------- */
/*  Status – posição, progresso, ETA e contagem de tolerância                */
/* -------------------------------------------------------------------------- */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bell, BellOff } from "lucide-react";

import TurnModal from "@/components/TurnModal";
import LeaveQueueConfirmation from "@/components/LeaveQueueConfirmation";
import ThankYouScreen from "@/components/ThankYouScreen";
import NoShowScreen from "@/components/NoShowScreen";
import TimeDisplay from "@/components/TimeDisplay";

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

  /** cronômetro da tolerância (segundos) */
  const [toleranceLeft, setToleranceLeft] = useState<number | null>(null);

  /* modais */
  const [turnModal, setTurnModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);

  /* refs para controle de notificações */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasNotifiedNext = useRef(false);
  const hasNotifiedReady = useRef(false);

  /* ------------------------------------------------------------------------ */
  /*  Setup inicial                                                           */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    fetchPartyData();

    // Realtime
    const channel = supabase
      .channel(`party_${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'parties', filter: `id=eq.${id}` },
        (payload) => {
          console.log('Party updated:', payload);
          fetchPartyData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate]);

  /* ------------------------------------------------------------------------ */
  /*  Fetch party data                                                        */
  /* ------------------------------------------------------------------------ */
  const fetchPartyData = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('parties')
        .select(`
          *,
          restaurants!parties_restaurant_id_fkey (
            id,
            name,
            menu_url,
            avg_seat_time_minutes
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const partyData: Party = {
          id: data.id,
          name: data.name,
          party_size: data.party_size,
          queue_position: data.queue_position,
          initial_position: data.initial_position,
          estimated_wait_minutes: data.estimated_wait_minutes,
          tolerance_minutes: data.tolerance_minutes,
          joined_at: data.joined_at,
          status: data.status,
          restaurant: data.restaurants ? {
            id: data.restaurants.id,
            name: data.restaurants.name,
            menu_url: data.restaurants.menu_url,
            avg_seat_time_minutes: data.restaurants.avg_seat_time_minutes
          } : null,
          restaurant_id: data.restaurant_id
        };

        setParty(partyData);

        // Calcular ETA melhorado
        if (partyData.queue_position && partyData.restaurant?.avg_seat_time_minutes) {
          const eta = partyData.queue_position * partyData.restaurant.avg_seat_time_minutes;
          setBetterEstimatedTime(eta);
        }

        // Verificar se chegou a vez e mostrar modal
        if (partyData.status === 'next' && !hasNotifiedNext.current) {
          setTurnModal(true);
          hasNotifiedNext.current = true;
          playNotificationSound();
        }

        // Verificar se a mesa está pronta
        if (partyData.status === 'ready' && !hasNotifiedReady.current) {
          hasNotifiedReady.current = true;
          playNotificationSound();
          
          toast({
            title: "Mesa Pronta! 🎉",
            description: "Sua mesa está pronta! Dirija-se ao restaurante.",
          });
        }
      }

    } catch (error: any) {
      console.error('Error fetching party:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Notificações                                                            */
  /* ------------------------------------------------------------------------ */
  const playNotificationSound = () => {
    if (notificationsEnabled && audioRef.current) {
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
  /*  Cronômetros – tempo decorrido                                           */
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
  /*  Handlers                                                                */
  /* ------------------------------------------------------------------------ */
  const handleLeaveQueue = async () => {
    try {
      const { error } = await supabase
        .from('parties')
        .update({
          status: 'removed',
          removed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setLeaveModal(false);
      setThanksOpen(true);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
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

  /* ------------------------------------------------------------------------ */
  /*  Helpers                                                                 */
  /* ------------------------------------------------------------------------ */
  const progress = (() => {
    if (!party || party.initial_position == null) return 0;
    if (party.initial_position === 0) return 100;
    const current = party.queue_position ?? 0;
    const initial = party.initial_position;
    return Math.max(0, Math.min(100, ((initial - current) / initial) * 100));
  })();

  const getStatusMessage = () => {
    if (!party) return "";

    switch (party.status) {
      case 'waiting':
        return party.queue_position === 1 
          ? "Você é o próximo!" 
          : `Posição ${party.queue_position} na fila`;
      case 'next':
        return "É a sua vez! 🎉";
      case 'ready':
        return "Mesa pronta! Dirija-se ao restaurante";
      case 'seated':
        return "Você já foi acomodado";
      case 'removed':
        return "Você saiu da fila";
      case 'no_show':
        return "Você foi marcado como ausente";
      default:
        return "Status desconhecido";
    }
  };

  const getEstimatedTime = () => {
    if (betterEstimatedTime !== null) return betterEstimatedTime;
    if (party?.estimated_wait_minutes) return party.estimated_wait_minutes;
    if (party?.queue_position && party.restaurant?.avg_seat_time_minutes) {
      return party.queue_position * party.restaurant.avg_seat_time_minutes;
    }
    return null;
  };

  /* ------------------------------------------------------------------------ */
  /*  Render                                                                  */
  /* ------------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando status...</p>
        </div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Party não encontrado</p>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      {/* Audio element para notificações */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">{party.restaurant?.name}</h1>
          <p className="text-gray-600">Olá, {party.name}!</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold mb-2">{getStatusMessage()}</h2>
            <Progress value={progress} className="w-full mb-4" />
          </div>

          {/* Time Info */}
          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div>
              <p className="text-sm text-gray-600">Tempo decorrido</p>
              <p className="text-lg font-semibold">{elapsedMinutes} min</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tempo estimado</p>
              <p className="text-lg font-semibold">
                {getEstimatedTime() ? `~${getEstimatedTime()} min` : "Calculando..."}
              </p>
            </div>
          </div>

          {/* Tolerance Timer */}
          {toleranceLeft !== null && toleranceLeft > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">Tempo para comparecer:</p>
                <TimeDisplay 
                  timeInSeconds={toleranceLeft} 
                  label="para comparecer"
                  className="text-red-700 font-bold" 
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
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

            {party.restaurant?.menu_url && (
              <Button
                variant="outline"
                onClick={() => window.open(party.restaurant!.menu_url!, '_blank')}
                className="w-full"
              >
                Ver Menu
              </Button>
            )}

            <Button
              variant="destructive"
              onClick={() => setLeaveModal(true)}
              className="w-full"
            >
              Sair da Fila
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TurnModal
        isOpen={turnModal}
        onConfirm={() => setTurnModal(false)}
        onCancel={() => setTurnModal(false)}
        toleranceTimeLeft={toleranceLeft ?? (party.tolerance_minutes ?? 10) * 60}
        restaurantName={party.restaurant?.name ?? ""}
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
