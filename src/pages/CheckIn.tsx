import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_RESTAURANT_ID = "550e8400-e29b-41d4-a716-446655440000";

const CheckIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { restaurantId } = useParams<{ restaurantId: string }>(); // opcional
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    partySize: "",
    notificationType: "sms",
  });

  /* -------------------------------------------------- */
  /* helpers                                            */
  /* -------------------------------------------------- */
  const validate = () => {
    if (!formData.name || !formData.phone || !formData.partySize) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return false;
    }
    const n = parseInt(formData.partySize);
    if (isNaN(n) || n < 1) {
      toast({
        title: "Tamanho do grupo inválido",
        description: "Insira um número válido de pessoas.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  /* -------------------------------------------------- */
  /* submit                                             */
  /* -------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const partySizeNum = parseInt(formData.partySize);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("parties")
        .insert([
          {
            restaurant_id: restaurantId ?? DEFAULT_RESTAURANT_ID,
            name: formData.name,
            phone: formData.phone,
            party_size: partySizeNum,
            notification_type: formData.notificationType,
            status: "waiting",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Bem-vindo à lista de espera!",
        description: "Você receberá atualizações no seu telefone.",
      });

      /* -> status page com ID real */
      navigate(`/status/${data.id}`);
    } catch (err) {
      console.error(err);
      toast({
        title: "Algo deu errado",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------- */
  /* UI                                                 */
  /* -------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* header */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Button>
        <h1 className="text-lg font-semibold text-gray-900">Entrar na Lista</h1>
        <div className="w-16" />
      </div>

      {/* form */}
      <div className="px-6 pb-6">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Digite seu nome"
                className="h-12"
              />
            </div>

            {/* telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Número de Telefone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(11) 99999-9999"
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
                value={formData.partySize}
                onChange={(e) =>
                  setFormData({ ...formData, partySize: e.target.value })
                }
                placeholder="Quantas pessoas?"
                className="h-12"
              />
            </div>

            {/* preferência de notificação */}
            <div className="space-y-3">
              <Label>Como gostaria de ser notificado?</Label>
              <RadioGroup
                value={formData.notificationType}
                onValueChange={(value) =>
                  setFormData({ ...formData, notificationType: value })
                }
                className="space-y-3"
              >
                {[
                  ["sms", "📱 Mensagem de texto (SMS)"],
                  ["whatsapp", "💬 Mensagem no WhatsApp"],
                  ["call", "📞 Ligação telefônica"],
                  ["push", "🔔 Notificação no app"],
                  ["email", "📧 E-mail"],
                ].map(([value, label]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={value} />
                    <Label htmlFor={value} className="cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* botão */}
            <Button
              className="w-full h-14 text-lg font-semibold bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              disabled={loading}
              type="submit"
            >
              {loading ? "Entrando..." : "Entrar na Lista de Espera"}
            </Button>

            {/* info */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Tempo de espera estimado:{" "}
                <span className="font-semibold text-orange-600">
                  25-30 minutos
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Você pode sair e voltar — guardaremos seu lugar!
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
