
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EmailConfirm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthConfirmation = async () => {
      try {
        // Configurar listener para mudanças de estado de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth event:', event, session);
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('User signed in, creating restaurant...');
              
              // Recuperar dados do restaurante do localStorage
              const pendingDataStr = localStorage.getItem('pendingRestaurantData');
              if (!pendingDataStr) {
                toast({
                  title: "Erro",
                  description: "Dados do restaurante não encontrados. Tente fazer o cadastro novamente.",
                  variant: "destructive"
                });
                navigate("/register");
                return;
              }

              const restaurantData = JSON.parse(pendingDataStr);

              try {
                // Criar o restaurante agora que o usuário está autenticado
                const { error: restaurantError } = await supabase
                  .from('restaurants')
                  .insert({
                    name: restaurantData.restaurantName,
                    description: restaurantData.description,
                    address: restaurantData.address,
                    phone: restaurantData.phone,
                    website: restaurantData.website,
                    email: restaurantData.email,
                    avg_seat_time_minutes: restaurantData.avgSeatTimeMinutes,
                    default_tolerance_minutes: restaurantData.defaultToleranceMinutes,
                    owner_id: session.user.id,
                    is_active: true
                  });

                if (restaurantError) {
                  console.error('Restaurant creation error:', restaurantError);
                  throw restaurantError;
                }

                // Limpar dados do localStorage
                localStorage.removeItem('pendingRestaurantData');

                toast({
                  title: "Sucesso!",
                  description: "Conta confirmada e estabelecimento cadastrado com sucesso!",
                });

                // Redirecionar para o dashboard admin
                navigate("/admin");
              } catch (error: any) {
                console.error('Error creating restaurant:', error);
                toast({
                  title: "Erro ao criar estabelecimento",
                  description: error.message || "Ocorreu um erro ao criar o estabelecimento",
                  variant: "destructive"
                });
                navigate("/register");
              }
            } else if (event === 'SIGNED_OUT') {
              navigate("/");
            }
          }
        );

        // Verificar se já há uma sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Se já está logado, dispara o processo diretamente
          console.log('Already signed in, processing...');
        }

        setLoading(false);

        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (error: any) {
        console.error('Auth confirmation error:', error);
        toast({
          title: "Erro na confirmação",
          description: error.message || "Erro ao confirmar conta",
          variant: "destructive"
        });
        navigate("/");
        setLoading(false);
      }
    };

    handleAuthConfirmation();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-center">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Confirmando sua conta...
              </h2>
              <p className="text-gray-600">
                Aguarde enquanto finalizamos seu cadastro.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Processando confirmação
              </h2>
              <p className="text-gray-600">
                Sua conta está sendo confirmada. Você será redirecionado em breve.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailConfirm;
