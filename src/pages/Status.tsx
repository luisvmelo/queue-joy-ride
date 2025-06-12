import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
type PartyRow = {
  id: string;
  name: string;
  phone: string;
  party_size: number;
  queue_position: number;
  status: "waiting" | "next" | "ready" | "seated";
  restaurant_id: string;
  restaurant: {               // “alias” que puxaremos do join
    name: string;
    tolerance_minutes: number;
  } | null;
};

/* ------------------------------------------------------------------ */
/* Componente                                                          */
export default function Status() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [party, setParty]   = useState<PartyRow | null>(null);

  /* --------------------------- fetch único ------------------------- */
  useEffect(() => {
    async function fetchParty() {
      if (!id) {
        toast({
          title: "Link inválido",
          description: "ID de status ausente.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("parties")
        .select(
          "*, restaurant:restaurants(name, tolerance_minutes)" // join
        )
        .eq("id", id)
        .single<PartyRow>();

      if (error || !data) {
        toast({
          title: "Status não encontrado",
          description: "Não foi possível localizar seu pedido na fila.",
          variant: "destructive",
        });
        navigate("/");
      } else {
        setParty(data);
      }
      setLoading(false);
    }

    fetchParty();
  }, [id, navigate, toast]);

  /* --------------------------- render ------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-600">Carregando…</p>
      </div>
    );
  }
  if (!party) return null; // já tratamos erro com toast + redirect

  /* Cálculos -------------------------------------------------------- */
  const progress =
    party.status === "waiting"
      ? Math.max(0, 100 - party.queue_position * 10)
      : 100;
  const tolerance =
    party.restaurant?.tolerance_minutes !== null
      ? party.restaurant?.tolerance_minutes ?? 2
      : 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* cabeçalho */}
      <div className="flex items-center justify-between p-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Início</span>
        </Button>
        <h1 className="text-lg font-semibold">Status da Fila</h1>
        <div className="w-16" />
      </div>

      {/* conteúdo */}
      <div className="max-w-md mx-auto px-6 space-y-6 pb-10">
        <div className="bg-white p-6 rounded-2xl shadow text-center space-y-1">
          <h2 className="text-2xl font-bold">Olá {party.name}!</h2>
          <p className="text-gray-600">
            Grupo de {party.party_size}{" "}
            {party.party_size === 1 ? "pessoa" : "pessoas"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <div className="text-center">
            <p className="text-4xl font-bold mb-1">#{party.queue_position}</p>
            <p className="text-gray-600">Sua posição na fila</p>
          </div>

          <Progress value={progress} />

          {party.status === "ready" && (
            <p className="text-center text-green-600 font-medium">
              Sua mesa está pronta! Você tem {tolerance} min para chegar 😊
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
