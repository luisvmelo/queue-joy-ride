import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Minutes') ? parseInt(value) || 0 : value
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
      // Cadastrar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_type: 'owner'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Criar o restaurante
        const { error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            name: formData.restaurantName,
            description: formData.description,
            address: formData.address,
            phone: formData.phone,
            website: formData.website,
            email: formData.email,
            avg_seat_time_minutes: formData.avgSeatTimeMinutes,
            default_tolerance_minutes: formData.defaultToleranceMinutes,
            owner_id: authData.user.id,
            is_active: true
          });

        if (restaurantError) throw restaurantError;

        toast({
          title: "Sucesso!",
          description: "Estabelecimento cadastrado com sucesso! Verifique seu email para confirmar a conta.",
        });

        // Redirecionar para página de login ou dashboard
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastre seu Estabelecimento</h1>
        <p className="text-gray-600">Junte-se à plataforma Line-up e modernize seu atendimento</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex justify-center px-6 pb-12">
        <div className="max-w-2xl w-full">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
            
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
                    value={formData.fullName}
                    onChange={handleInputChange}
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
                    value={formData.email}
                    onChange={handleInputChange}
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
                    value={formData.password}
                    onChange={handleInputChange}
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
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
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
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
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
                    value={formData.phone}
                    onChange={handleInputChange}
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
                    value={formData.website}
                    onChange={handleInputChange}
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
                  value={formData.address}
                  onChange={handleInputChange}
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
                    value={formData.avgSeatTimeMinutes}
                    onChange={handleInputChange}
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
                    value={formData.defaultToleranceMinutes}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(\"/\")}
                className=\"flex-1\"
              >
                Voltar
              </Button>
              
              <Button
                type=\"submit\"
                disabled={loading}
                className=\"flex-1 bg-black text-white hover:bg-gray-800\"
              >
                {loading ? \"Cadastrando...\" : \"Cadastrar Estabelecimento\"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
