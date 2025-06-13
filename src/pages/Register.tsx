import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Este componente lida com o fluxo completo de cadastro:
 * 1. Cria o usuário no Supabase Auth;
 * 2. Faz login imediatamente (signInWithPassword) para obter session JWT –
 *    necessário porque o signUp exige verificação de e‑mail e devolve
 *    session = null;
 * 3. Insere o restaurante, confiando no trigger set_restaurant_owner para
 *    preencher owner_id caso algo falhe.
 */
const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Dados do responsável
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Dados do estabelecimento
    restaurantName: "",
    description: "",
    address: "",
    phone: "",
    website: "",
    avgSeatTimeMinutes: 45,
    defaultToleranceMinutes: 5
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes("Minutes") ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Cria o usuário
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_type: "owner"
          }
        }
      });

      if (signUpErr) throw signUpErr;

      // 2. Garante sessão: se o projeto exigir verificação de e‑mail,
      // signUpData.session será null. Então fazemos signIn imediato.
      let userId: string | undefined;

      if (signUpData.session?.user?.id) {
        userId = signUpData.session.user.id;
      } else {
        const { data: signInData, error: signInErr } =
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
          });
        if (signInErr) throw signInErr;
        userId = signInData.session.user.id;
      }

      // 3. Insere o restaurante
      const { error: insertErr } = await supabase.from("restaurants").insert({
        owner_id: userId, // gatilho preenche caso falhe
        name: formData.restaurantName,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        website: formData.website,
        email: formData.email,
        avg_seat_time_minutes: formData.avgSeatTimeMinutes,
        default_tolerance_minutes: formData.defaultToleranceMinutes,
        is_active: true
      });

      if (insertErr) throw insertErr;

      toast({
        title: "Sucesso!",
        description:
          "Estabelecimento cadastrado com sucesso! Verifique seu e‑mail para confirmar a conta.",
      });

      setTimeout(() => navigate("/"), 2000);
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="text-center pt-8 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastre seu Estabelecimento</h1>
        <p className="text-gray-600">Junte-se à plataforma Line-up e modernize seu atendimento</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex justify-center px-6 pb-12">
        <div className="max-w-2xl w-full">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
            {/* ==== Dados do Responsável ==== */}
            {/* (conteúdo original permanece igual) */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
