// src/pages/Status.tsx  (substitua tudo)

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PartyRow = {
  id: string;
  name: string;
  party_size: number;
  queue_position: number;
  estimated_wait_minutes: number;
  status: "waiting" | "next" | "ready" | "seated";
  restaurant_id: string;
  restaurant: {
    name: string;
    menu_url: string | null;
    tolerance_minutes: number | null;
  } | null;
};

export default function Status() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading]     = useState(true);
  const [party, setParty]         = useState<PartyRow | null>(null);
  const [queueLen, setQueueLen]   = useState<number>(0);

  /* ------------------------------------------------ fetch party */
  useEffect(() => {
    async function load() {
      if (!id) { nav("/"); return; }

      /* 1️⃣ Party + restaurante ---------------------------------- */
      const { data: p, error: err } = await supabase
        .from("parties")
        .select(
          "*, restaurant:restaurants(name, menu_url, tolerance_minutes)"
        )
        .eq("id", id)
        .single<PartyRow>();

      if (err || !p) {
        toast({ title:"Status não encontrado", variant:"destructive" });
        nav("/"); return;
      }
      setParty(p);

      /* 2️⃣ Quantos ainda estão na fila do mesmo restaurante ------ */
      const { count } = await supabase
        .from("parties")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", p.restaurant_id)
        .in("status", ["waiting","next","ready"]);
      setQueueLen(count ?? 0);

      setLoading(false);
    }
    load();
  }, [id, nav, toast]);

  /* ------------------------------------------------ render */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando…
      </div>
    );
  }
  if (!party) return null;

  const progress =
    queueLen > 0 ? ((queueLen - party.queue_position) / queueLen) * 100 : 0;

  const tolerance = party.restaurant?.tolerance_minutes ?? 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* topo */}
      <div className="flex items-center justify-between p-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => nav("/")}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" /> <span>Início</span>
        </Button>
        <h1 className="font-semibold">Status da Fila</h1>
        <div className="w-16" />
      </div>

      {/* conteúdo */}
      <div className="max-w-md mx-auto px-6 pb-12 space-y-6">
        {/* Saudação */}
        <div className="bg-white p-6 rounded-2xl shadow text-center space-y-1">
          <h2 className="text-2xl font-bold">Olá {party.name}!</h2>
          <p className="text-gray-600">
            Grupo de {party.party_size}{" "}
            {party.party_size === 1 ? "pessoa" : "pessoas"}
          </p>
        </div>

        {/* Card posição */}
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <div className="text-center">
            <p className="text-5xl font-bold mb-1">
              {party.queue_position === 0 ? "🎉" : `#${party.queue_position}`}
            </p>
            <p className="text-gray-600">
              {party.queue_position === 0
                ? "Sua mesa está pronta!"
                : "Sua posição na fila"}
            </p>
          </div>

          <Progress value={progress} className="h-3" />

          {party.queue_position === 0 ? (
            <p className="text-center text-green-600 font-medium">
              Você tem {tolerance} min para chegar até a recepção.
            </p>
          ) : (
            <p className="text-center text-gray-700">
              Tempo estimado&nbsp;
              <span className="font-semibold">
                {party.estimated_wait_minutes} min
              </span>
            </p>
          )}
        </div>

        {/* Ações */}
        {party.restaurant?.menu_url && (
          <Button
            className="w-full h-12 bg-black text-white hover:bg-gray-800"
            onClick={() => window.open(party.restaurant!.menu_url!, "_blank")}
          >
            🍽️&nbsp;Ver Cardápio
          </Button>
        )}
      </div>
    </div>
  );
}
