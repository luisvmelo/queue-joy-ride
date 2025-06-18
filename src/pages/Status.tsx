/* -------------------------------------------------------------------------- */
/*  Status – posição, progresso, ETA e contagem de tolerância                */
/* -------------------------------------------------------------------------- */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bell, BellOff } from "lucide-react";

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
  restaurant_id: string | null;
  restaurant_name: string | null;
  restaurant_menu_url: string | null;
  restaurant_avg_seat_time_minutes: number | null;
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

  /* ------------------------------------------------------------------------ */
  /*  Security: Get customer credentials from localStorage                    */
  /* ------------------------------------------------------------------------ */
  const getCustomerCredentials = () => {
    const phone = localStorage.getItem(`party_${id}_phone`);
    const name = localStorage.getItem(`party_${id}_name`);
    return { phone, name };
  };

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
  /*  Secure fetch party data using security definer function                */
  /* ------------------------------------------------------------------------ */
  const fetchPartyData = async () => {
    if (!id) return;

    const { phone, name } = getCustomerCredentials();
    
    if (!phone || !name) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    // Sanitize inputs to prevent XSS
    const sanitizedPhone = phone.replace(/[^\d+\-\s()]/g, '');
    const sanitizedName = name.replace(/[<>"/]/g, '');

    try {
      const { data, error } = await supabase
        .rpc('get_customer_party', {
          party_uuid: id,
          customer_phone: sanitizedPhone,
          customer_name: sanitizedName
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const partyData = data[0];
        
        const formattedParty: Party = {
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
          restaurant_id: partyData.restaurant_id,
          restaurant_name: partyData.restaurant_name,
          restaurant_menu_url: partyData.restaurant_menu_url,
          restaurant_avg_seat_time_minutes: partyData.restaurant_avg_seat_time_minutes
        };

        // Verificar mudanças de status para disparar popups
        const currentStatus = formattedParty.status;
        const currentPosition = formattedParty.queue_position;

        console.log('Current state:', { 
          currentStatus, 
          currentPosition, 
          previousStatus: previousStatus.current, 
          previousPosition: previousPosition.current,
          hasNotifiedNext: hasNotifiedNext.current,
          hasNotifiedReady: hasNotifiedReady.current
        });

        // Reset flags se status mudou para waiting
        if (currentStatus === 'waiting' && previousStatus.current !== 'waiting') {
          hasNotifiedNext.current = false;
          hasNotifiedReady.current = false;
          console.log('Reset notification flags - status changed to waiting');
        }

        // Popup "Você é o Próximo!" - quando vira posição 1 e ainda está waiting
        if (currentPosition === 1 && 
            currentStatus === 'waiting' && 
            !hasNotifiedNext.current &&
            (previousPosition.current !== 1 || previousStatus.current !== 'waiting')) {
          console.log('Triggering next modal - position 1, status waiting');
          setNextModal(true);
          hasNotifiedNext.current = true;
          playNotificationSound();
          sendBrowserNotification("Você é o Próximo! 🎯", "Prepare-se! Você será chamado em breve.");
          
          toast({
            title: "Você é o Próximo! 🎯",
            description: "Prepare-se! Você será chamado em breve.",
          });
        }

        // Popup "É Sua Vez!" - quando status muda para ready
        if (currentStatus === 'ready' && 
            !hasNotifiedReady.current &&
            previousStatus.current !== 'ready') {
          console.log('Triggering turn modal - status ready');
          setTurnModal(true);
          hasNotifiedReady.current = true;
          playNotificationSound();
          sendBrowserNotification("Mesa Pronta! 🎉", "Sua mesa está pronta! Dirija-se ao restaurante.");
          
          toast({
            title: "Mesa Pronta! 🎉",
            description: "Sua mesa está pronta! Dirija-se ao restaurante.",
          });
        }

        // Atualizar refs
        previousStatus.current = currentStatus;
        previousPosition.current = currentPosition;

        setParty(formattedParty);

        // Calcular ETA melhorado
        if (formattedParty.queue_position && formattedParty.restaurant_avg_seat_time_minutes) {
          const eta = formattedParty.queue_position * formattedParty.restaurant_avg_seat_time_minutes;
          setBetterEstimatedTime(eta);
        }

      } else {
        setAccessDenied(true);
      }

    } catch (error: any) {
      console.error('Error fetching party:', error);
      setAccessDenied(true);
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

  const sendBrowserNotification = (title: string, body: string) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        requireInteraction: true
      });
    }
  };

  const requestNotificationPermission = async () => {
    console.log('Requesting notification permission...');
    
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações.",
        variant: "destructive"
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        
        // Enviar notificação de teste
        new Notification("Notificações Ativadas! 🔔", {
          body: "Você receberá avisos quando for sua vez na fila.",
          icon: '/favicon.ico'
        });
        
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá avisos quando for sua vez na fila.",
        });
      } else {
        toast({
          title: "Permissão negada",
          description: "Para receber notificações, permita no seu navegador.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Erro nas notificações",
        description: "Não foi possível ativar as notificações.",
        variant: "destructive"
      });
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
  /*  Secure handlers using new security definer functions                   */
  /* ------------------------------------------------------------------------ */
  const handleLeaveQueue = async () => {
    if (!party) return;
    
    const { phone } = getCustomerCredentials();
    if (!phone) {
      toast({
        title: "Erro de Segurança",
        description: "Credenciais não encontradas",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('update_customer_party_status', {
          party_uuid: party.id,
          customer_phone: phone,
          new_status: 'removed'
        });

      if (error) throw error;

      if (data) {
        setLeaveModal(false);
        setThanksOpen(true);
      } else {
        throw new Error('Não foi possível sair da fila');
      }
    } catch (error: any) {
      console.error('Error leaving queue:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível sair da fila",
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
    if (party?.queue_position && party.restaurant_avg_seat_time_minutes) {
      return party.queue_position * party.restaurant_avg_seat_time_minutes;
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

  if (accessDenied || !party) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar este party ou ele não foi encontrado.
          </p>
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
          <h1 className="text-2xl font-bold mb-2">{party.restaurant_name}</h1>
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
              {party.joined_at && (
                <TimeCounter 
                  startTime={party.joined_at}
                  label="Tempo na fila"
                />
              )}
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
                <TimeCounter 
                  startTime={new Date(Date.now() - ((party.tolerance_minutes || 10) * 60 * 1000 - toleranceLeft * 1000)).toISOString()}
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

            {party.restaurant_menu_url && (
              <Button
                variant="outline"
                onClick={() => window.open(party.restaurant_menu_url!, '_blank')}
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
      <TurnNotificationModal
        isOpen={turnModal}
        onConfirm={() => setTurnModal(false)}
        onCancel={() => setTurnModal(false)}
        toleranceTimeLeft={(party?.tolerance_minutes ?? 10) * 60}
        restaurantName={party?.restaurant_name ?? ""}
      />

      <TurnNotificationModal
        isOpen={nextModal}
        onConfirm={() => setNextModal(false)}
        onCancel={() => setNextModal(false)}
        toleranceTimeLeft={0}
        restaurantName={party?.restaurant_name ?? ""}
        isNextInLine={true}
      />

      <LeaveQueueConfirmation
        isOpen={leaveModal}
        onCancel={() => setLeaveModal(false)}
        onConfirm={handleLeaveQueue}
        restaurantName={party?.restaurant_name ?? ""}
      />

      <ThankYouScreen
        isOpen={thanksOpen}
        onJoinAgain={() => navigate(`/check-in/${party.restaurant_id}`)}
        restaurantName={party?.restaurant_name ?? ""}
      />

      <NoShowScreen
        isOpen={noShowOpen}
        onRejoinQueue={handleRejoinQueue}
        newPosition={50}
        restaurantName={party?.restaurant_name ?? ""}
      />
    </div>
  );
};

export default Status;
