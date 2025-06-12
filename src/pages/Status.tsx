// src/pages/Status.tsx
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
}

interface Party {
  id: string;
  name: string;
  party_size: number;
  queue_position: number | null;         // posição atual (0 == pronto)
  initial_position: number | null;       // posição ao entrar
  estimated_wait_minutes: number | null; // ETA calculado
  tolerance_minutes: number | null;      // prazo p/ chegar quando posição==0
  restaurant: Restaurant | null;
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

  const [turnModal, setTurnModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);

  /* ------------------------------------------------------------------------ */
  /*  Query inicial + assinatura realtime                                     */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      if (!id) return navigate("/");

      const { data, error } = await supabase
        .from("parties")
        .select(
          `
          id, name, party_size,
          queue_position, initial_position,
          estimated_wait_minutes, tolerance_minutes,
          restaurant:restaurants ( id, name, menu_url )
        `
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        toast({
          title: "Erro ao carregar dados",
          description: error?.message ?? "Registro não encontrado.",
          variant: "destructive",
        });
        return navigate("/");
      }

      setParty(data as Party);
      setLoading(false);

      /* realtime ----------------------------------------------------------- */
      channel = supabase
        .channel("party_updates")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "parties", filter: `id=eq.${id}` },
          ({ new: next }) => setParty((prev) => ({ ...(prev as Party), ...(next as any) }))
        )
        .subscribe();
    };

    load();
    return () => channel && supabase.removeChannel(channel);
  }, [id]);

  /* ------------------------------------------------------------------------ */
  /*  helpers                                                                 */
  /* ------------------------------------------------------------------------ */
  /** progresso 0 – 100 % */
  const progress = (() => {
    if (!party || party.queue_position == null || party.initial_position == null) return 0;
    if (party.initial_position === 0) return 100;
    const perc =
      ((party.initial_position - (party.queue_position ?? 0)) / party.initial_position) * 100;
    return Math.min(Math.max(Math.round(perc), 0), 100);
  })();

  /** tempo a exibir */
  const etaText =
    party?.queue_position === 0
      ? `${party.tolerance_minutes ?? "--"}`
      : `${party?.estimated_wait_minutes ?? "--"}`;

  /* ------------------------------------------------------------------------ */
  /*  UI – carregando                                                         */
  /* ------------------------------------------------------------------------ */
  if (loading || !party)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Carregando…
      </div>
    );

  /* ------------------------------------------------------------------------ */
  /*  UI – página principal                                                   */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* header simples */}
      <header className="py-4 text-center">
        <h1 className="text-lg font-semibold">Status da Fila</h1>
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
                <p className="font-semibold">Sua mesa está pronta!</p>
              </>
            ) : (
              <>
                <div className="text-4xl font-bold">{party.queue_position}</div>
                <p className="text-gray-600">Sua posição na fila</p>
              </>
            )}
          </div>

          {/* progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* tempo */}
          <div className="text-center">
            {party.queue_position === 0 ? (
              <TimeDisplay
                timeInSeconds={(party.tolerance_minutes ?? 0) * 60}
                label="Tempo para chegar"
              />
            ) : (
              <TimeDisplay
                initialMinutes={party.estimated_wait_minutes ?? 0}
                label="Tempo estimado"
                isCountdown
              />
            )}
          </div>
        </section>

        {/* botões */}
        {party.restaurant?.menu_url && (
          <Button
            className="w-full h-12 bg-black text-white hover:bg-gray-800"
            onClick={() => window.open(party.restaurant!.menu_url!, "_blank")}
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
        toleranceTimeLeft={(party.tolerance_minutes ?? 0) * 60}
      />

      <LeaveQueueConfirmation
        isOpen={leaveModal}
        onCancel={() => setLeaveModal(false)}
        onConfirm={() => {
          setLeaveModal(false);
          setThanksOpen(true);
        }}
        restaurantName={party.restaurant?.name ?? ""}
      />

      <ThankYouScreen
        isOpen={thanksOpen}
        onJoinAgain={() => navigate("/check-in")}
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
