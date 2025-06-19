
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDashboardAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; type?: string } | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      // Aguardar um pouco para localStorage estar disponível (principalmente após redirecionamento)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verificar se é acesso de recepcionista (localStorage primeiro, sessionStorage como backup, URL como último recurso)
      let receptionistRestaurant = localStorage.getItem('receptionist_restaurant') || sessionStorage.getItem('receptionist_restaurant');
      let receptionistAccess = receptionistRestaurant ? 
        localStorage.getItem(`receptionist_access_${receptionistRestaurant}`) || 
        sessionStorage.getItem(`receptionist_access_${receptionistRestaurant}`) : null;
      
      // Verificar URL params como backup
      const urlParams = new URLSearchParams(window.location.search);
      const urlAuthId = urlParams.get('auth');
      if (!receptionistRestaurant && urlAuthId && window.location.pathname === '/receptionist') {
        // Validar se o restaurante existe
        const { data: restaurant, error } = await supabase
          .from('restaurants')
          .select('id, name, is_active')
          .eq('id', urlAuthId)
          .single();
          
        if (!error && restaurant?.is_active) {
          receptionistRestaurant = urlAuthId;
          receptionistAccess = 'true';
          
          // Tentar salvar no localStorage novamente
          try {
            localStorage.setItem(`receptionist_access_${urlAuthId}`, 'true');
            localStorage.setItem('receptionist_restaurant', urlAuthId);
            sessionStorage.setItem(`receptionist_access_${urlAuthId}`, 'true');
            sessionStorage.setItem('receptionist_restaurant', urlAuthId);
          } catch (storageError) {
            console.warn('Still unable to save to storage:', storageError);
          }
        }
      }
      
      console.log('🔍 Checking receptionist auth at', new Date().toISOString(), {
        receptionistRestaurant,
        receptionistAccess,
        currentPath: window.location.pathname,
        currentUrl: window.location.href,
        localStorage: {
          restaurant: localStorage.getItem('receptionist_restaurant'),
          access: receptionistRestaurant ? localStorage.getItem(`receptionist_access_${receptionistRestaurant}`) : null
        },
        sessionStorage: {
          restaurant: sessionStorage.getItem('receptionist_restaurant'),
          access: receptionistRestaurant ? sessionStorage.getItem(`receptionist_access_${receptionistRestaurant}`) : null
        },
        allLocalStorage: Object.keys(localStorage).filter(k => k.includes('receptionist')),
        allSessionStorage: Object.keys(sessionStorage).filter(k => k.includes('receptionist')),
        urlParams: Object.fromEntries(new URLSearchParams(window.location.search))
      });
      
      if (receptionistAccess && receptionistRestaurant) {
        // Validar se o restaurante ainda existe
        const { data: restaurant, error } = await supabase
          .from('restaurants')
          .select('id, name, is_active')
          .eq('id', receptionistRestaurant)
          .single();

        if (error || !restaurant?.is_active) {
          console.error('❌ Restaurant validation failed:', { error, restaurant, receptionistRestaurant });
          // Limpar acesso inválido
          localStorage.removeItem(`receptionist_access_${receptionistRestaurant}`);
          localStorage.removeItem('receptionist_restaurant');
          sessionStorage.removeItem(`receptionist_access_${receptionistRestaurant}`);
          sessionStorage.removeItem('receptionist_restaurant');
          
          toast({
            title: "Acesso expirado",
            description: "Restaurante não encontrado ou inativo",
            variant: "destructive"
          });
          navigate("/receptionist-login");
          return;
        }

        // Recepcionista tem acesso válido - não verificar Supabase auth
        console.log('✅ Receptionist access validated for restaurant:', restaurant.name);
        
        // Garantir que os dados estão salvos (redundância para evitar perda)
        try {
          localStorage.setItem(`receptionist_access_${receptionistRestaurant}`, 'true');
          localStorage.setItem('receptionist_restaurant', receptionistRestaurant);
          sessionStorage.setItem(`receptionist_access_${receptionistRestaurant}`, 'true');
          sessionStorage.setItem('receptionist_restaurant', receptionistRestaurant);
        } catch (storageError) {
          console.warn('Storage save failed during validation:', storageError);
        }
        
        setUser({ id: 'receptionist', email: 'receptionist@local', type: 'receptionist' });
        setRestaurantId(receptionistRestaurant);
        setLoading(false);
        return;
      }

      // Verificar autenticação normal do Supabase apenas se não for recepcionista
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Verificar se tentou acessar como recepcionista mas falhou
        if (window.location.pathname === '/receptionist') {
          toast({
            title: "Acesso negado",
            description: "Faça login como recepcionista",
            variant: "destructive"
          });
          navigate("/receptionist-login");
        } else {
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para acessar o dashboard",
            variant: "destructive"
          });
          navigate("/login");
        }
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
      
      // Se é acesso de recepcionista, redirecionar para login da recepcionista
      let receptionistRestaurant = localStorage.getItem('receptionist_restaurant') || sessionStorage.getItem('receptionist_restaurant');
      if (receptionistRestaurant) {
        navigate("/receptionist-login");
      } else {
        toast({
          title: "Erro de autenticação",
          description: "Ocorreu um erro durante a verificação de acesso",
          variant: "destructive"
        });
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return { loading, user, restaurantId };
};
