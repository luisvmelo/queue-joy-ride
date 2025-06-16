
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

      const { data: userRestaurantId, error: restaurantError } = await supabase
        .rpc('get_user_restaurant_id');

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

      if (!userRestaurantId) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar este dashboard",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setRestaurantId(userRestaurantId);
    } catch (error) {
      console.error('Authentication error:', error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  return { loading, user, restaurantId };
};
