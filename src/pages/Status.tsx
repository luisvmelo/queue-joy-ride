// src/pages/Status.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import TurnModal from "@/components/TurnModal";
import LeaveQueueConfirmation from "@/components/LeaveQueueConfirmation";
import ThankYouScreen from "@/components/ThankYouScreen";
import NoShowScreen from "@/components/NoShowScreen";
import TimeDisplay from "@/components/TimeDisplay";

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
  estimated_wait_minutes: number | null;
  tolerance_minutes: number | null;
  restaurant: {
    id: string;
    name: string;
    menu_url: string | null;
  } | null;
}

/* -------------------------------------------------------------------------- */
/*  Componente                                                                */
/* -------------------------------------------------------------------------- */

const Status = () => {
  /* ---------------------------------- misc --------------------------------- */
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* ------------------------------- local state ------------------------------ */
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);

  const [turnModalOpen, setTurnModalOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [thankYouOpen, setThankYouOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);

  /* ----------------------- buscar dados iniciais (Supabase) ----------------- */
  useEffect(() => {
    let sub: ReturnType<typeof supabase.channel> | null = null;

    const fetchData = async () => {
      if (!id) return navigate("/");

      const { data, error } = await supabase
        .from("parties")
        .select(
          `
            id, name, phone, party_size,
            queue_position, estimated_wait_minutes, tolerance_minutes,
            restaurant:restaurants ( id, name, menu_url )
          `
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        toast({
          title: "Erro ao carregar dados",
          description: error?.message ?? "Entrada não encontrada",
          variant: "destructive",
        });
        return navigate("/");
      }

      setParty(data as Party);
      setLoading(false);

      /* --- subscribe to realtime updates (opcional) ------------------------ */
      sub = supabase
        .channel("party_updates")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "parties",
            filter: `id=eq.${id}`,
          },
          (payload) => {
            setParty((old) => ({ ...(old as Party), ...(payload.new as any) }));
          }
        )
        .subscribe();
    };

    fetchData();
    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [id]);

  /* -------------------------- progress / contagem -------------------------- */
  const progress =
    party && party.queue_position !== null && party.queue_position >= 0
      ? ((party.queue_position === 0 ? 1 : 0) * 100 +
          Math.max(
            0,
            100 -
              ((party.queue_position ?? 0) + 1) *
                (100 / ((party.queue_position ?? 0) + 4))
          ))
      : 0;

  /* ----------------------- handlers / botões / diálogos -------------------- */
  const handleLeaveQueue = () => setLeaveConfirmOpen(true);
  const handleCancelLeave = () => setLeaveConfirmOpen(false);
  const handleConfirmLeave = () => {
    setLeaveConfirmOpen(false);
    setThankYouOpen(true);
  };

  const handleRejoinQueue = () => {
    setNoShowOpen(false);
    /* lógica real de reinserção ficaria aqui */
  };

  /* -------------------------------------------------------------------------- */
  /*  UI                                                                        */
  /* -------------------------------------------------------------------------- */

  if (loading || !party)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Carregando…
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* HEADER (sem seta voltar) */}
      <div className="py-4 text-center">
        <h1 className="text-lg font-semibold">Status da Fila</h1>
      </div>

      <div className="max-w-md mx-auto px-6 pb-12 space-y-6">
        {/* Saudação */}
        <div className="bg-white p-6 rounded-2xl shadow text-center space-y-1">
          <h2 className="text-2xl font-bold">
            Olá {party.name}! <span>👋</span>
          </h2>
          <p className="text-gray-600">
            Grupo de {party.party_size}{" "}
            {party.party_size === 1 ? "pessoa" : "pessoas"}
          </p>
        </div>

        {/* Card posição */}
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <div className="text-center">
            <p className="text-5xl font-bold mb-1">
              {party.queue_position === 0 ? "🎉" : party.queue_position ?? "–"}
            </p>
            <p className="text-gray-600">
              {party.queue_position === 0
                ? "Sua mesa está pronta!"
                : "Sua posição na fila"}
            </p>
          </div>

          {/* PROGRESSO */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* TEMPO */}
          <p className="text-center text-gray-700">
            Tempo estimado{" "}
            <span className="font-semibold">
              {(party.queue_position ?? 0) === 0
                ? party.tolerance_minutes
                : party.estimated_wait_minutes ?? "--"}{" "}
              min
            </span>
          </p>
        </div>

        {/* AÇÕES */}
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
          onClick={handleLeaveQueue}
        >
          Sair da Fila
        </Button>
      </div>

      {/* diálogos */}
      <TurnModal
        isOpen={turnModalOpen}
        onCancel={() => setTurnModalOpen(false)}
        onConfirm={() => setTurnModalOpen(false)}
        toleranceTimeLeft={(party.tolerance_minutes ?? 0) * 60}
        restaurantName={party.restaurant?.name ?? ""}
      />

      <LeaveQueueConfirmation
        isOpen={leaveConfirmOpen}
        onCancel={handleCancelLeave}
        onConfirm={handleConfirmLeave}
        restaurantName={party.restaurant?.name ?? ""}
      />

      <ThankYouScreen
        isOpen={thankYouOpen}
        onJoinAgain={() => navigate("/check-in")}
        restaurantName={party.restaurant?.name ?? ""}
      />

      <NoShowScreen
        isOpen={noShowOpen}
        onRejoinQueue={handleRejoinQueue}
        restaurantName={party.restaurant?.name ?? ""}
        newPosition={(party.queue_position ?? 0) + 1}
      />
    </div>
  );
};

export default Status;
