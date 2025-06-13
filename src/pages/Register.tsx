
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building2 } from 'lucide-react';

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Dados do usuário
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    
    // Dados do estabelecimento
    const restaurantName = formData.get('restaurantName') as string;
    const description = formData.get('description') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;
    const website = formData.get('website') as string;

    try {
      // 1. Criar o usuário
      const { error: signUpError } = await signUp(email, password, fullName, 'owner');
      
      if (signUpError) {
        throw signUpError;
      }

      // 2. Obter o usuário recém-criado (precisamos aguardar um pouco para o trigger criar o profile)
      setTimeout(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // 3. Criar o restaurante
            const { error: restaurantError } = await supabase
              .from('restaurants')
              .insert({
                name: restaurantName,
                description: description || null,
                address: address || null,
                phone: phone || null,
                email: email,
                website: website || null,
                owner_id: user.id,
                is_active: true
              });

            if (restaurantError) {
              throw restaurantError;
            }

            toast({
              title: "Cadastro realizado com sucesso!",
              description: "Verifique seu email para confirmar sua conta e aguarde a ativação do seu estabelecimento."
            });
          }
        } catch (error: any) {
          console.error('Erro ao criar restaurante:', error);
          toast({
            title: "Erro",
            description: "Usuário criado, mas houve erro ao cadastrar o estabelecimento. Entre em contato conosco.",
            variant: "destructive"
          });
        }
      }, 2000);

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center">
            <Building2 className="w-6 h-6 mr-2 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Cadastrar Estabelecimento</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Junte-se ao FilaFácil</CardTitle>
            <p className="text-center text-gray-600">
              Cadastre seu estabelecimento e comece a gerenciar filas de forma inteligente
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados do Responsável */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Dados do Responsável
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Crie uma senha segura"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {/* Dados do Estabelecimento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Dados do Estabelecimento
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Nome do Estabelecimento *</Label>
                  <Input
                    id="restaurantName"
                    name="restaurantName"
                    type="text"
                    placeholder="Nome do seu restaurante/bar"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descreva brevemente seu estabelecimento"
                    className="min-h-20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Endereço completo"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      placeholder="https://seusite.com"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                {isLoading ? 'Cadastrando...' : 'Cadastrar Estabelecimento'}
              </Button>
              
              <p className="text-sm text-gray-600 text-center">
                Ao cadastrar-se, você concorda com nossos termos de uso e política de privacidade.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
