
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

      // Use the new security definer function to get user's restaurant
      console.log('🔐 Getting user restaurant IDs for user:', session.user.id);
      
      const { data: restaurantIds, error: restaurantError } = await supabase
        .rpc('get_user_restaurant_ids');

      console.log('🏪 Restaurant IDs result:', { restaurantIds, restaurantError });

      if (restaurantError) {
        console.error('❌ Error getting user restaurant:', restaurantError);
        toast({
          title: "Erro de acesso",
          description: "Não foi possível encontrar seu restaurante",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      if (!restaurantIds || restaurantIds.length === 0) {
        console.log('❌ No restaurant IDs found for user');
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar este dashboard",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      // Use the first restaurant ID found
      const selectedRestaurantId = restaurantIds[0].restaurant_id;
      console.log('✅ Using restaurant ID:', selectedRestaurantId);
      setRestaurantId(selectedRestaurantId);
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
