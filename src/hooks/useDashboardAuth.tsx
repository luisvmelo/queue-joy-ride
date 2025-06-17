
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDashboardAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      // Verificar se é acesso de recepcionista (sem autenticação completa)
      const receptionistRestaurant = localStorage.getItem('receptionist_restaurant');
      const receptionistAccess = localStorage.getItem(`receptionist_access_${receptionistRestaurant}`);
      
      if (receptionistAccess && receptionistRestaurant) {
        // Validar se o restaurante ainda existe
        const { data: restaurant, error } = await supabase
          .from('restaurants')
          .select('id, name, is_active')
          .eq('id', receptionistRestaurant)
          .single();

        if (error || !restaurant?.is_active) {
          // Limpar acesso inválido
          localStorage.removeItem(`receptionist_access_${receptionistRestaurant}`);
          localStorage.removeItem('receptionist_restaurant');
          
          toast({
            title: "Acesso expirado",
            description: "Restaurante não encontrado ou inativo",
            variant: "destructive"
          });
          navigate("/");
          return;
        }

        setUser({ id: 'receptionist', email: 'receptionist@local' });
        setRestaurantId(receptionistRestaurant);
        setLoading(false);
        return;
      }

      // Verificar autenticação normal do Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Acesso negado",
          description: "Você precisa estar logado para acessar o dashboard",
          variant: "destructive"
        });
        navigate("/login");
        return;
      }

      setUser(session.user);

      // Usar a função security definer para obter os restaurantes do usuário
      const { data: restaurantIds, error: restaurantError } = await supabase
        .rpc('get_user_restaurant_ids');

      if (restaurantError) {
        console.error('Error getting user restaurant:', restaurantError);
        toast({
          title: "Erro de acesso",
          description: "Não foi possível encontrar seu restaurante",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      if (!restaurantIds || restaurantIds.length === 0) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar este dashboard",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      // Usar o primeiro restaurante encontrado
      setRestaurantId(restaurantIds[0].restaurant_id);
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Erro de autenticação",
        description: "Ocorreu um erro durante a verificação de acesso",
        variant: "destructive"
      });
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  return { loading, user, restaurantId };
};
