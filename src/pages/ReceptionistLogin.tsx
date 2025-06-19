
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ReceptionistLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [restaurantCode, setRestaurantCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Digite o código no formato RECEP + 4 dígitos",
        variant: "destructive"
      });
      return;
    }

    const code = restaurantCode.toUpperCase().trim();
    
    // Verificar se começa com RECEP
    if (!code.startsWith('RECEP')) {
      toast({
        title: "Formato inválido",
        description: "O código deve começar com RECEP seguido de 4 dígitos",
        variant: "destructive"
      });
      return;
    }

    // Extrair os 4 dígitos depois de RECEP
    const digits = code.substring(5);
    if (digits.length !== 4 || !/^\d{4}$/.test(digits)) {
      toast({
        title: "Formato inválido", 
        description: "Digite RECEP seguido de exatamente 4 dígitos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Buscar restaurante pelo código (últimos 4 dígitos do ID)
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('id, name, is_active')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching restaurants:', error);
        throw new Error('Erro ao buscar restaurantes');
      }

      // Encontrar restaurante que termina com o código digitado
      const matchingRestaurant = restaurants?.find(restaurant => 
        restaurant.id.slice(-4) === digits
      );

      if (!matchingRestaurant) {
        toast({
          title: "Código inválido",
          description: "Restaurante não encontrado com esse código",
          variant: "destructive"
        });
        return;
      }

      // Redirecionar diretamente para o dashboard da recepcionista
      navigate(`/receptionist-access/${matchingRestaurant.id}`);
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Acesso da Recepção</CardTitle>
          <p className="text-gray-600">
            Digite o código do seu restaurante
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="restaurantCode" className="block text-sm font-medium text-gray-700 mb-2">
                Código do Restaurante
              </label>
              <Input
                id="restaurantCode"
                type="text"
                placeholder="Ex: RECEP1234"
                value={restaurantCode}
                onChange={(e) => setRestaurantCode(e.target.value)}
                className="text-center text-lg font-mono uppercase"
                maxLength={9}
              />
            </div>
            
            <Button 
              type="submit"
              disabled={loading || !restaurantCode.trim()}
              className="w-full h-12"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {loading ? "Verificando..." : "Continuar"}
            </Button>

            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="text-gray-500"
              >
                Voltar ao início
              </Button>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700 text-center">
                💡 <strong>Formato:</strong> RECEP + 4 últimos dígitos do ID do restaurante
              </p>
              <p className="text-xs text-blue-600 text-center mt-1">
                Exemplo: Para ID terminado em 3315, digite <strong>RECEP3315</strong>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceptionistLogin;
