
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import TurnModal from "@/components/TurnModal";
import TimeDisplay from "@/components/TimeDisplay";
import LeaveQueueConfirmation from "@/components/LeaveQueueConfirmation";
import ThankYouScreen from "@/components/ThankYouScreen";
import NoShowScreen from "@/components/NoShowScreen";

import { supabase } from "@/integrations/supabase/client";

type Party = {
  id: string;
  name: string;
  phone: string;
  party_size: number;
  queue_position: number | null;
  status: string; // waiting, next, ready, seated, no_show
  tolerance_minutes: number | null;
  restaurant_id: string;
  restaurant_name?: string; // opcional (pode vir via view)
};

const Status = () => {
  /* ───────────────────────── params / hooks ───────────────────────── */
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* ───────────────────────── local state ───────────────────────── */
  const [party, setParty] = useState<Party | null>(null);

  const [showTurnModal, setShowTurnModal] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showNoShow, setShowNoShow] = useState(false);
  const [toleranceTimeLeft, setToleranceTimeLeft] = useState(0);
  const [isLeavingFromTurnModal, setIsLeavingFromTurnModal] = useState(false);

  /* ───────────────────────── fetch inicial + polling ───────────────────────── */
  useEffect(() => {
    if (!partyId) return;

    const fetchParty = async () => {
      const { data, error } = await supabase
        .from("parties")
        .select(`
          id, 
          name, 
          phone, 
          party_size, 
          queue_position, 
          status, 
          restaurant_id,
          restaurants!inner(
            tolerance_minutes,
            name
          )
        `)
        .eq("id", partyId)
        .single();

      if (!error && data) {
        const partyData: Party = {
          id: data.id,
          name: data.name,
          phone: data.phone,
          party_size: data.party_size,
          queue_position: data.queue_position,
          status: data.status,
          restaurant_id: data.restaurant_id,
          tolerance_minutes: data.restaurants?.tolerance_minutes || null,
          restaurant_name: data.restaurants?.name || undefined
        };
        setParty(partyData);
      }
    };

    fetchParty();
    const interval = setInterval(fetchParty, 8000); // atualizar a cada 8 s
    return () => clearInterval(interval);
  }, [partyId]);

  /* ───────────────────────── iniciar contagem tolerância ───────────────────────── */
  useEffect(() => {
    if (party?.status === "ready" && party.tolerance_minutes) {
      setToleranceTimeLeft(party.tolerance_minutes * 60);
    }
  }, [party?.status, party?.tolerance_minutes]);

  /* countdown de tolerância até No-show */
  useEffect(() => {
    if (toleranceTimeLeft <= 0 || party?.status !== "ready") return;

    const intv = setInterval(() => {
      setToleranceTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intv);
          setShowTurnModal(false);
          setShowNoShow(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intv);
  }, [toleranceTimeLeft, party?.status]);

  /* mostrar modal quando status vira ready */
  useEffect(() => {
    if (party?.status === "ready") setShowTurnModal(true);
  }, [party?.status]);

  /* ───────────────────────── derived values ───────────────────────── */
  const progressPercentage = party
    ? Math.min(
        100,
        Math.max(
          0,
          ((party.queue_position ?? 0) === 0
            ? 100
            : 100 - (party.queue_position ?? 0) * 10)
        )
      )
    : 0;

  /* ───────────────────────── event handlers ───────────────────────── */
  const handleLeaveQueue = () => setShowLeaveConfirmation(true);
  const handleCancelLeave = () => {
    setShowLeaveConfirmation(false);
    if (isLeavingFromTurnModal) {
      setIsLeavingFromTurnModal(false);
      setShowTurnModal(true);
    }
  };
  const handleConfirmLeave = () => {
    setShowLeaveConfirmation(false);
    setIsLeavingFromTurnModal(false);
    setShowTurnModal(false);
    setShowThankYou(true);
    toast({ title: "Removido da lista", description: "Você foi removido da fila" });
  };
  const handleJoinAgain = () => {
    setShowThankYou(false);
    navigate("/check-in"); // fluxo de novo check-in
  };
  const handleViewMenu = () => {
    window.open("https://example.com/menu", "_blank");
  };
  const handleConfirmTurn = () => {
    setShowTurnModal(false);
    toast({ title: "Confirmado!", description: "Dirija-se à recepção do restaurante" });
  };
  const handleCancelTurn = () => {
    setShowTurnModal(false);
    setIsLeavingFromTurnModal(true);
    handleLeaveQueue();
  };
  const handleRejoinQueue = () => {
    setShowNoShow(false);
    toast({ title: "Solicite para ser reinserido pela recepção." });
  };

  /* ───────────────────────── render ───────────────────────── */
  if (!party) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Início</span>
        </Button>
        <h1 className="text-lg font-semibold text-black">Status da Fila</h1>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <div className="max-w-md mx-auto space-y-8">
          {/* Party Info */}
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center space-y-2">
            <h2 className="text-2xl font-bold text-black">
              Olá {party.name}! 👋
            </h2>
            <p className="text-gray-600">
              Grupo de {party.party_size}{" "}
              {party.party_size === 1 ? "pessoa" : "pessoas"}
            </p>
          </div>

          {/* Position & progress */}
          <div className="bg-white rounded-2xl p-6 shadow-lg space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">
                #{party.queue_position ?? "—"}
              </div>
              <p className="text-gray-600">Sua posição na fila</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progresso</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {/* status específico */}
            {party.status === "ready" && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center space-y-1">
                <h3 className="text-xl font-bold text-black">
                  Sua mesa está pronta!
                </h3>
                <p className="text-gray-700">Dirija-se à recepção</p>
                <p className="text-sm text-gray-600">
                  Você tem {Math.floor(toleranceTimeLeft / 60)} minutos para
                  chegar
                </p>
              </div>
            )}

            {party.status === "next" && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
                <h3 className="text-xl font-bold text-black mb-1">
                  Você é o próximo!
                </h3>
                <p className="text-gray-700">Sua mesa ficará pronta em breve</p>
              </div>
            )}

            {/* cronômetro/estimativa */}
            {party.status === "ready" ? (
              <TimeDisplay
                timeInSeconds={toleranceTimeLeft}
                label="Tempo para chegar ao restaurante"
                className="text-center"
              />
            ) : (
              <TimeDisplay
                initialMinutes={25}
                label="Tempo estimado de espera"
                isCountdown
                className="text-center"
              />
            )}
          </div>

          {/* Botões */}
          <div className="space-y-3">
            <Button
              onClick={handleViewMenu}
              className="w-full h-12 bg-black text-white hover:bg-gray-800"
            >
              🍽️ Ver Cardápio
            </Button>
            <Button
              onClick={handleLeaveQueue}
              variant="outline"
              className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50"
            >
              Sair da Fila
            </Button>
          </div>

          {/* Live info */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Atualizações ao vivo ativas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      <TurnModal
        isOpen={showTurnModal}
        onConfirm={handleConfirmTurn}
        onCancel={handleCancelTurn}
        toleranceTimeLeft={toleranceTimeLeft}
        restaurantName={party.restaurant_name || "Restaurante"}
      />

      <LeaveQueueConfirmation
        isOpen={showLeaveConfirmation}
        onCancel={handleCancelLeave}
        onConfirm={handleConfirmLeave}
        restaurantName={party.restaurant_name || "Restaurante"}
      />

      <ThankYouScreen
        isOpen={showThankYou}
        onJoinAgain={handleJoinAgain}
        restaurantName={party.restaurant_name || "Restaurante"}
      />

      <NoShowScreen
        isOpen={showNoShow}
        onRejoinQueue={handleRejoinQueue}
        restaurantName={party.restaurant_name || "Restaurante"}
        newPosition={(party.queue_position ?? 0) + 1}
      />
    </div>
  );
};

export default Status;
