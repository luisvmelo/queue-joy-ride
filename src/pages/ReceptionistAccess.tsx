
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ReceptionistAccess = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [accessCode, setAccessCode] = useState("");
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant();
    } else {
      toast({
        title: "Erro",
        description: "ID do restaurante não encontrado na URL",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    if (!restaurantId) return;
    
    try {
      console.log('Fetching restaurant with ID:', restaurantId);
      const { data, error } = await supabase
        .from('restaurants')
        .select('name, is_active')
        .eq('id', restaurantId)
        .single();

      if (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Restaurante não encontrado');
      }
      
      if (!data.is_active) {
        throw new Error('Restaurante não está ativo');
      }
      
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast({
        title: "Erro",
        description: "Restaurante não encontrado ou inativo",
        variant: "destructive"
      });
      navigate('/');
    }
  };

  const handleAccess = async () => {
    if (!accessCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Digite o código de acesso da recepção",
        variant: "destructive"
      });
      return;
    }

    if (!restaurantId) {
      toast({
        title: "Erro",
        description: "ID do restaurante não encontrado",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simular validação do código (em produção, validar no backend)
      // Por simplicidade, usando um código padrão: RECEP + últimos 4 dígitos do restaurant ID
      const expectedCode = `RECEP${restaurantId.slice(-4)}`;
      
      console.log('Expected code:', expectedCode, 'Entered code:', accessCode.toUpperCase());
      
      if (accessCode.toUpperCase() === expectedCode) {
        // Salvar acesso na sessão
        localStorage.setItem(`receptionist_access_${restaurantId}`, 'true');
        localStorage.setItem(`receptionist_restaurant`, restaurantId);
        
        toast({
          title: "Acesso liberado",
          description: "Bem-vindo ao painel da recepção",
        });
        
        navigate('/receptionist');
      } else {
        toast({
          title: "Código inválido",
          description: "Código de acesso incorreto",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error validating access:', error);
      toast({
        title: "Erro",
        description: "Erro ao validar acesso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">ID do restaurante não encontrado na URL</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Acesso da Recepção</CardTitle>
          <p className="text-gray-600">
            {restaurant?.name || 'Carregando...'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
              Código de Acesso
            </label>
            <Input
              id="accessCode"
              type="text"
              placeholder="Digite o código"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAccess()}
              className="text-center text-lg font-mono"
            />
          </div>
          
          <Button 
            onClick={handleAccess}
            disabled={loading || !accessCode.trim()}
            className="w-full h-12"
          >
            <Lock className="w-4 h-4 mr-2" />
            {loading ? "Validando..." : "Acessar Painel"}
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
              💡 <strong>Dica:</strong> O código é RECEP + últimos 4 dígitos do ID do restaurante
            </p>
            {restaurantId && (
              <p className="text-xs text-blue-600 text-center mt-1">
                Para este restaurante: <strong>RECEP{restaurantId.slice(-4)}</strong>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceptionistAccess;
