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
  const [turnModal, setTurnModal]       = useState(false);
  const [leaveModal, setLeaveModal]     = useState(false);
  const [thanksOpen, setThanksOpen]     = useState(false);
  const [noShowOpen, setNoShowOpen]     = useState(false);

  /* refs para controle de notificações */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasNotifiedNext = useRef(false);
  const hasNotifiedReady = useRef(false);

  /* ------------------------------------------------------------------------ */
  /*  Setup inicial                                                           */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    // Criar elemento de áudio para notificações
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');

    // Verificar permissão de notificações
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /*  Query inicial + assinatura realtime                                     */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      if (!id) { navigate("/"); return; }

      const { data, error } = await supabase
        .from("parties")
        .select(`
          id, name, party_size,
          queue_position, initial_position,
          estimated_wait_minutes, tolerance_minutes,
          joined_at, restaurant_id, status,
          restaurant:restaurants ( id, name, menu_url, avg_seat_time_minutes )
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        toast({
          title: "Erro ao carregar dados",
          description: error?.message ?? "Registro não encontrado",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setParty(data as unknown as Party);
      
      // Calcular tempo decorrido
      if (data.joined_at) {
        const elapsed = Math.floor((Date.now() - new Date(data.joined_at).getTime()) / 60000);
        setElapsedMinutes(elapsed);
      }

      // Calcular tempo estimado melhorado
      if (data.restaurant_id && data.queue_position && data.queue_position > 0) {
        calculateBetterEstimatedTime(data.restaurant_id, data.queue_position);
      }

      setLoading(false);

      /* realtime para mudanças na própria party */
      channel = supabase
        .channel(`party_updates_${id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "parties", filter: `id=eq.${id}` },
          ({ new: next, old: prev }) => {
            console.log("Party update:", { next, prev });
            
            // Verificar mudanças importantes
            if (prev.queue_position !== next.queue_position || prev.status !== next.status) {
              handleQueueUpdate(prev as Party, next as Party);
            }
            
            setParty((current) => ({ ...(current as Party), ...(next as any) }));
            
            // Recalcular tempo se posição mudou
            if (next.queue_position !== prev.queue_position && next.restaurant_id && next.queue_position > 0) {
              calculateBetterEstimatedTime(next.restaurant_id, next.queue_position);
            }
          }
        )
        .subscribe();
    };

    load();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [id, navigate, toast]);

  /* ------------------------------------------------------------------------ */
  /*  Lidar com atualizações da fila e notificações                          */
  /* ------------------------------------------------------------------------ */
  const handleQueueUpdate = (oldParty: Party, newParty: Party) => {
    // Notificar quando for o próximo (posição 1)
    if (newParty.queue_position === 1 && oldParty.queue_position !== 1 && !hasNotifiedNext.current) {
      hasNotifiedNext.current = true;
      showNotification(
        "Você é o próximo! 🎯",
        `Prepare-se, você será chamado em breve no ${newParty.restaurant?.name}`,
        true
      );
    }

    // Notificar quando for chamado (status muda para ready ou posição 0)
    if ((newParty.status === 'ready' || newParty.queue_position === 0) && 
        oldParty.status !== 'ready' && !hasNotifiedReady.current) {
      hasNotifiedReady.current = true;
      showNotification(
        "Sua vez chegou! 🎉",
        `Sua mesa no ${newParty.restaurant?.name} está pronta!`,
        true,
        true // vibrar
      );
      setTurnModal(true);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Sistema de notificações                                                */
  /* ------------------------------------------------------------------------ */
  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");
      
      toast({
        title: permission === "granted" ? "Notificações ativadas!" : "Notificações negadas",
        description: permission === "granted" 
          ? "Você será notificado quando for sua vez" 
          : "Você pode ativar nas configurações do navegador",
      });
    }
  };

  const showNotification = (title: string, body: string, playSound = false, vibrate = false) => {
    // Toast sempre aparece
    toast({
      title,
      description: body,
      duration: 5000,
    });

    // Som
    if (playSound && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Erro ao tocar som:", e));
    }

    // Vibração (se suportado)
    if (vibrate && "vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // Notificação do navegador
    if (notificationsEnabled && document.hidden) {
      new Notification(title, {
        body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "queue-notification",
        requireInteraction: true,
      });
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Calcular tempo estimado baseado em dados históricos                     */
  /* ------------------------------------------------------------------------ */
  const calculateBetterEstimatedTime = async (restaurantId: string, currentPosition: number) => {
    try {
      const { data: avgData } = await supabase
        .from('v_avg_wait_by_position')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .lte('initial_position', currentPosition)
        .order('initial_position', { ascending: false });

      if (avgData && avgData.length > 0) {
        let totalMinutes = 0;
        
        for (let pos = 1; pos <= currentPosition; pos++) {
          const posData = avgData.find(d => d.initial_position === pos);
          if (posData && posData.avg_wait_min) {
            totalMinutes += posData.avg_wait_min;
          } else {
            totalMinutes += party?.restaurant?.avg_seat_time_minutes || 45;
          }
        }

        setBetterEstimatedTime(Math.round(totalMinutes));
      } else {
        const avgTime = party?.restaurant?.avg_seat_time_minutes || 45;
        setBetterEstimatedTime(avgTime * currentPosition);
      }
    } catch (error) {
      console.error('Erro ao calcular tempo estimado:', error);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  Atualizar tempo decorrido                                               */
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
      await supabase.rpc('handle_no_show', { p_party_id: party.id });
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
    const current = party.queue_position ?? party.initial_position;
    const perc = ((party.initial_position - current) / party.initial_position) * 100;
    return Math.min(Math.max(Math.round(perc), 0), 100);
  })();

  const displayEstimatedTime = betterEstimatedTime || party?.estimated_wait_minutes || 0;
  const remainingTime = Math.max(0, displayEstimatedTime - elapsedMinutes);

  /* ------------------------------------------------------------------------ */
  /*  UI                                                                      */
  /* ------------------------------------------------------------------------ */
  if (loading || !party) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando informações da fila...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* header */}
      <header className="py-4 text-center relative">
        <h1 className="text-lg font-semibold">Status da Fila</h1>
        {party.restaurant && (
          <p className="text-sm text-gray-600">{party.restaurant.name}</p>
        )}
        
        {/* Botão de notificações */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={requestNotificationPermission}
        >
          {notificationsEnabled ? (
            <Bell className="h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-400" />
          )}
        </Button>
      </header>

      <main className="max-w-md mx-auto px-6 pb-12 space-y-6">
        {/* Status removido ou atendido */}
        {(party.status === 'seated' || party.status === 'removed') && (
          <section className="bg-gray-100 p-6 rounded-2xl text-center">
            <p className="text-gray-600">
              {party.status === 'seated' 
                ? 'Você já foi atendido. Obrigado!' 
                : 'Você saiu da fila.'}
            </p>
            <Button 
              className="mt-4"
              onClick={() => navigate("/")}
            >
              Voltar ao início
            </Button>
          </section>
        )}

        {/* Status ativo */}
        {party.status === 'waiting' || party.status === 'ready' ? (
          <>
            {/* Saudação */}
            <section className="bg-white p-6 rounded-2xl shadow text-center space-y-1">
              <h2 className="text-2xl font-bold">
                Olá {party.name}! <span>👋</span>
              </h2>
              <p className="text-gray-600">
                Grupo de {party.party_size} {party.party_size === 1 ? "pessoa" : "pessoas"}
              </p>
            </section>

            {/* Card posição/progresso */}
            <section className="bg-white p-6 rounded-2xl shadow space-y-6">
              {/* posição */}
              <div className="text-center space-y-1">
                {party.status === 'ready' || party.queue_position === 0 ? (
                  <>
                    <div className="text-4xl mb-1">🎉</div>
                    <p className="font-semibold text-lg">Sua mesa está pronta!</p>
                    <p className="text-sm text-gray-600">Dirija-se ao balcão</p>
                  </>
                ) : (
                  <>
                    <div className="text-5xl font-bold text-gray-900">
                      #{party.queue_position ?? "–"}
                    </div>
                    <p className="text-gray-600">Sua posição na fila</p>
                    {party.queue_position === 1 && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        Você é o próximo! 🎯
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progresso</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* tempo / contagem */}
              <div className="text-center space-y-4">
                {party.status === 'ready' ? (
                  <TimeDisplay
                    timeInSeconds={toleranceLeft ?? 0}
                    label="Tempo para chegar ao restaurante"
                    isCountdown
                  />
                ) : (
                  <>
                    <div className="space-y-2">
                      <TimeDisplay
                        initialMinutes={remainingTime}
                        label="Tempo estimado"
                        isCountdown
                      />
                      <p className="text-xs text-gray-500">
                        Aguardando há {elapsedMinutes} {elapsedMinutes === 1 ? 'minuto' : 'minutos'}
                      </p>
                    </div>
                    {betterEstimatedTime && party.estimated_wait_minutes && 
                     betterEstimatedTime !== party.estimated_wait_minutes && (
                      <p className="text-xs text-blue-600">
                        ⚡ Estimativa atualizada com base no histórico
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Info adicional */}
            <section className="bg-blue-50 p-4 rounded-xl text-center">
              <p className="text-sm text-blue-800">
                📱 Esta página atualiza automaticamente
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {notificationsEnabled 
                  ? "✅ Notificações ativadas - você será avisado"
                  : "🔕 Ative as notificações para ser avisado"}
              </p>
            </section>

            {/* botões */}
            {party.restaurant?.menu_url && (
              <Button
                className="w-full h-12 bg-black text-white hover:bg-gray-800"
                onClick={() => window.open(party.restaurant.menu_url!, "_blank")}
              >
                🍽️ Ver Cardápio
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setLeaveModal(true)}
            >
              Sair da Fila
            </Button>
          </>
        ) : null}
      </main>

      {/* Modais ---------------------------------------------------------------- */}
      <TurnModal
        isOpen={turnModal}
        onConfirm={() => setTurnModal(false)}
        onCancel={() => {
          setTurnModal(false);
          handleLeaveQueue();
        }}
        restaurantName={party.restaurant?.name ?? ""}
        toleranceTimeLeft={toleranceLeft ?? (party.tolerance_minutes ?? 10) * 60}
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