
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const [signUpData, setSignUpData] = useState({
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

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSignUpData(prev => ({
      ...prev,
      [name]: name.includes('Minutes') ? parseInt(value) || 0 : value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Erro no login",
            description: "Email ou senha incorretos, ou conta não confirmada",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive"
          });
        }
        return;
      }

      if (data.user) {
        // Verificar se o usuário tem um restaurante
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', data.user.id)
          .single();

        if (restaurantError || !restaurant) {
          toast({
            title: "Conta não encontrada",
            description: "Você não tem um estabelecimento cadastrado",
            variant: "destructive"
          });
          await supabase.auth.signOut();
          return;
        }

        toast({
          title: "Login realizado!",
          description: "Redirecionando para o painel administrativo...",
        });

        navigate("/admin");
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (signUpData.password.length < 6) {
      toast({
        title: "Erro", 
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Salvar dados do formulário no localStorage para usar após confirmação
      localStorage.setItem('pendingRestaurantData', JSON.stringify({
        restaurantName: signUpData.restaurantName,
        description: signUpData.description,
        address: signUpData.address,
        phone: signUpData.phone,
        website: signUpData.website,
        email: signUpData.email,
        avgSeatTimeMinutes: signUpData.avgSeatTimeMinutes,
        defaultToleranceMinutes: signUpData.defaultToleranceMinutes
      }));

      // Cadastrar usuário no Supabase Auth
      const { error: authError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.fullName,
            user_type: 'owner'
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (authError) throw authError;

      toast({
        title: "Cadastro realizado!",
        description: "Confira seu e-mail para confirmar a conta e finalizar o cadastro do estabelecimento.",
      });

      // Voltar para a tela de login
      setIsSignUp(false);
      setSignUpData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        restaurantName: "",
        description: "",
        address: "",
        phone: "",
        website: "",
        avgSeatTimeMinutes: 45,
        defaultToleranceMinutes: 5
      });

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isSignUp ? "Cadastrar Estabelecimento" : "Login Empresa"}
        </h1>
        <p className="text-gray-600">
          {isSignUp 
            ? "Junte-se à plataforma Line-up e modernize seu atendimento" 
            : "Acesse o painel administrativo do seu estabelecimento"
          }
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 flex justify-center px-6 pb-12">
        <div className="max-w-2xl w-full">
          {!isSignUp ? (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-6 bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={loginData.email}
                    onChange={handleLoginChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Não tem conta?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-black font-semibold hover:underline"
                    >
                      Cadastre-se aqui
                    </button>
                  </p>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  Voltar
                </Button>
              </div>
            </form>
          ) : (
            // Sign Up Form
            <form onSubmit={handleSignUp} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
              
              {/* Dados do Responsável */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Dados do Responsável</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={signUpData.fullName}
                      onChange={handleSignUpChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={signUpData.email}
                      onChange={handleSignUpChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={signUpData.password}
                      onChange={handleSignUpChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={signUpData.confirmPassword}
                      onChange={handleSignUpChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Estabelecimento */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Dados do Estabelecimento</h3>
                
                <div>
                  <Label htmlFor="restaurantName">Nome do Estabelecimento *</Label>
                  <Input
                    id="restaurantName"
                    name="restaurantName"
                    type="text"
                    required
                    value={signUpData.restaurantName}
                    onChange={handleSignUpChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={signUpData.description}
                    onChange={handleSignUpChange}
                    className="mt-1"
                    rows={3}
                    placeholder="Descreva seu estabelecimento..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={signUpData.phone}
                      onChange={handleSignUpChange}
                      className="mt-1"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={signUpData.website}
                      onChange={handleSignUpChange}
                      className="mt-1"
                      placeholder="https://seusite.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={signUpData.address}
                    onChange={handleSignUpChange}
                    className="mt-1"
                    placeholder="Rua, número, bairro, cidade - CEP"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="avgSeatTimeMinutes">Tempo médio por mesa (minutos)</Label>
                    <Input
                      id="avgSeatTimeMinutes"
                      name="avgSeatTimeMinutes"
                      type="number"
                      min="15"
                      max="300"
                      value={signUpData.avgSeatTimeMinutes}
                      onChange={handleSignUpChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="defaultToleranceMinutes">Tolerância padrão (minutos)</Label>
                    <Input
                      id="defaultToleranceMinutes"
                      name="defaultToleranceMinutes"
                      type="number"
                      min="1"
                      max="30"
                      value={signUpData.defaultToleranceMinutes}
                      onChange={handleSignUpChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  {loading ? "Cadastrando..." : "Criar Conta"}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Já tem conta? Faça login
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
