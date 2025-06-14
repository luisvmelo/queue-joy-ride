
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/** caso o QR não traga restaurantId na rota */
const DEFAULT_RESTAURANT_ID = "550e8400-e29b-41d4-a716-446655440000";

const CheckIn = () => {
  /* -------------------------------------- hooks */
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId?: string }>();
  const { toast } = useToast();

  /* -------------------------------------- state */
  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [currentQueueSize, setCurrentQueueSize] = useState(0);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    partySize: "",
    notificationType: "sms",
  });

  /* -------------------------------------- effects */
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        const currentRestaurantId = restaurantId ?? DEFAULT_RESTAURANT_ID;
        
        // Fetch restaurant info
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", currentRestaurantId)
          .single();

        if (restaurantError) throw restaurantError;
        setRestaurant(restaurantData);

        // Fetch current queue size
        const { data: queueData, error: queueError } = await supabase
          .from("parties")
          .select("id")
          .eq("restaurant_id", currentRestaurantId)
          .eq("status", "waiting");

        if (queueError) throw queueError;
        setCurrentQueueSize(queueData?.length || 0);
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do restaurante.",
          variant: "destructive",
        });
      }
    };

    fetchRestaurantData();
  }, [restaurantId, toast]);

  /* -------------------------------------- helpers */
  const setField =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value });

  const valid = () => {
    if (!form.name || !form.phone || !form.partySize) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, telefone e tamanho do grupo.",
        variant: "destructive",
      });
      return false;
    }
    const n = Number(form.partySize);
    if (!Number.isInteger(n) || n < 1) {
      toast({
        title: "Tamanho inválido",
        description: "Informe um número de pessoas maior que zero.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  /* -------------------------------------- submit */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("parties")
        .insert([
          {
            restaurant_id: restaurantId ?? DEFAULT_RESTAURANT_ID,
            name: form.name,
            phone: form.phone,
            party_size: Number(form.partySize),
            notification_type: form.notificationType,
            status: "waiting", // triggers calculam posições
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso! 🙌",
        description: "Você entrou na fila e receberá atualizações por mensagem.",
      });

      navigate(`/status/${data.id}`);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao entrar na fila",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular tempo estimado antes de entrar na fila
  const estimatedTime = restaurant?.avg_seat_time_minutes 
    ? (currentQueueSize + 1) * restaurant.avg_seat_time_minutes
    : (currentQueueSize + 1) * 45;

  /* -------------------------------------- UI */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* cabeçalho */}
      <header className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Início</span>
        </Button>
        <h1 className="text-lg font-semibold text-gray-900">
          Entrar na Lista
        </h1>
        <div className="w-16" />
      </header>

      {/* formulário */}
      <main className="px-6 pb-6">
        <div className="max-w-md mx-auto">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={setField("name")}
                placeholder="Digite seu nome"
                className="h-12"
              />
            </div>

            {/* telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={setField("phone")}
                placeholder="(11) 91234-5678"
                className="h-12"
              />
            </div>

            {/* tamanho do grupo */}
            <div className="space-y-2">
              <Label htmlFor="partySize">Tamanho do Grupo *</Label>
              <Input
                id="partySize"
                type="number"
                min="1"
                value={form.partySize}
                onChange={setField("partySize")}
                placeholder="Ex.: 4"
                className="h-12"
              />
            </div>

            {/* preferência de notificação */}
            <div className="space-y-3">
              <Label>Como prefere ser notificado?</Label>
              <RadioGroup
                value={form.notificationType}
                onValueChange={(v) => setForm({ ...form, notificationType: v })}
                className="space-y-3"
              >
                {([
                  ["sms", "📱 SMS"],
                  ["whatsapp", "💬 WhatsApp"],
                  ["call", "📞 Ligação"],
                  ["push", "🔔 Notificação"],
                  ["email", "📧 E-mail"],
                ] as const).map(([value, label]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem id={value} value={value} />
                    <Label htmlFor={value} className="cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Estimativa de tempo */}
            {currentQueueSize > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  ⏱️ Tempo estimado de espera: ~{estimatedTime} minutos
                </p>
                <p className="text-xs text-blue-700">
                  {currentQueueSize} {currentQueueSize === 1 ? 'pessoa' : 'pessoas'} na frente
                </p>
              </div>
            )}

            {/* botão */}
            <Button
              disabled={loading}
              type="submit"
              className="w-full h-14 bg-black text-white text-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Enviando…" : "Entrar na Lista de Espera"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CheckIn;
