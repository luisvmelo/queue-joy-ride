/* -------------------------------------------------------------------------- */
/*  Status – posição, progresso, ETA e contagem de tolerância                */
/* -------------------------------------------------------------------------- */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

  /** cronômetro da tolerância (segundos) */
  const [toleranceLeft, setToleranceLeft] = useState<number | null>(null);

  /* modais */
  const [turnModal, setTurnModal]       = useState(false);
  const [leaveModal, setLeaveModal]     = useState(false);
  const [thanksOpen, setThanksOpen]     = useState(false);
  const [noShowOpen, setNoShowOpen]     = useState(false);

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
          joined_at, restaurant_id,
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
          ({ new: next }) => {
            setParty((prev) => ({ ...(prev as Party), ...(next as any) }));
            
            // Recalcular tempo se posição mudou
            if (next.queue_position !== party?.queue_position && next.restaurant_id && next.queue_position > 0) {
              calculateBetterEstimatedTime(next.restaurant_id, next.queue_position);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "parties", filter: `restaurant_id=eq.${data.restaurant_id}` },
          () => {
            // Quando outras pessoas na fila mudam, recalcular posição
            if (data.restaurant_id && party?.queue_position && party.queue_position > 0) {
              calculateBetterEstimatedTime(data.restaurant_id, party.queue_position);
            }
          }
        )
        .subscribe();
    };

    load();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [id, navigate, toast]);

  /* ------------------------------------------------------------------------ */
  /*  Calcular tempo estimado baseado em dados históricos                     */
  /* ------------------------------------------------------------------------ */
  const calculateBetterEstimatedTime = async (restaurantId: string, currentPosition: number) => {
    try {
      // Buscar dados da view de tempo médio por posição
      const { data: avgData } = await supabase
        .from('v_avg_wait_by_position')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .lte('initial_position', currentPosition)
        .order('initial_position', { ascending: false });

      if (avgData && avgData.length > 0) {
        // Calcular tempo total baseado nos dados históricos
        let totalMinutes = 0;
        
        for (let pos = 1; pos <= currentPosition; pos++) {
          const posData = avgData.find(d => d.initial_position === pos);
          if (posData && posData.avg_wait_min) {
            totalMinutes += posData.avg_wait_min;
          } else {
            // Se não há dados para esta posição, usar média do restaurante
            totalMinutes += party?.restaurant?.avg_seat_time_minutes || 45;
          }
        }

        setBetterEstimatedTime(Math.round(totalMinutes));
      } else {
        // Fallback: usar tempo médio do restaurante
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
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, [party?.joined_at]);

  /* ------------------------------------------------------------------------ */
  /*  Tolerância – inicia contagem quando posição vira 0                      */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!party) return;

    if (party.queue_position === 0) {
      setToleranceLeft((party.tolerance_minutes ?? 0) * 60);
      setTurnModal(true); // Mostrar modal quando chegar a vez
    } else {
      setToleranceLeft(null);
    }
  }, [party?.queue_position, party?.tolerance_minutes]);

  useEffect(() => {
    if (toleranceLeft === null) return;
    if (toleranceLeft <= 0) { setNoShowOpen(true); return; }

    const interval = setInterval(() => {
      setToleranceLeft((prev) => (prev ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [toleranceLeft]);

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

  // Usar tempo estimado melhorado ou fallback para o original
  const displayEstimatedTime = betterEstimatedTime || party?.estimated_wait_minutes || 0;
  const remainingTime = Math.max(0, displayEstimatedTime - elapsedMinutes);

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

  /* ------------------------------------------------------------------------ */
  /*  UI – carregando                                                         */
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

  /* ------------------------------------------------------------------------ */
  /*  UI – página principal                                                   */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* header */}
      <header className="py-4 text-center">
        <h1 className="text-lg font-semibold">Status da Fila</h1>
        {party.restaurant && (
          <p className="text-sm text-gray-600">{party.restaurant.name}</p>
        )}
      </header>

      <main className="max-w-md mx-auto px-6 pb-12 space-y-6">
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
            {party.queue_position === 0 ? (
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
            {party.queue_position === 0 ? (
              <TimeDisplay
                timeInSeconds={toleranceLeft ?? 0}
                label="Tempo para chegar"
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
            Você será notificado quando sua mesa estiver pronta
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
      </main>

      {/* Modais ---------------------------------------------------------------- */}
      <TurnModal
        isOpen={turnModal}
        onConfirm={() => setTurnModal(false)}
        onCancel={() => setTurnModal(false)}
        restaurantName={party.restaurant?.name ?? ""}
        toleranceTimeLeft={toleranceLeft ?? (party.tolerance_minutes ?? 0) * 60}
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
        onRejoinQueue={() => setNoShowOpen(false)}
        newPosition={(party.queue_position ?? 0) + 1}
        restaurantName={party.restaurant?.name ?? ""}
      />
    </div>
  );
};

export default Status;