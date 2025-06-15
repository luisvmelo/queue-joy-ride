import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EmailConfirm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleAuthConfirmation = async () => {
      try {
        console.log('🔗 URL atual:', window.location.href);
        console.log('🔗 Hash:', window.location.hash);
        console.log('🔗 Search:', window.location.search);

        // Verificar se há tokens na URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        
        console.log('🔑 Tokens encontrados:', { access_token: !!access_token, refresh_token: !!refresh_token });

        // Se há tokens, processar a sessão
        if (access_token && refresh_token) {
          console.log('✅ Processando tokens...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) {
            console.error('❌ Erro ao definir sessão:', error);
            throw error;
          }

          console.log('✅ Sessão definida:', data);
          
          if (data.user) {
            await processUserConfirmation(data.user);
          }
        } else {
          // Verificar se já existe uma sessão ativa
          const { data: { session } } = await supabase.auth.getSession();
          console.log('📋 Sessão existente:', !!session);
          
          if (session?.user) {
            await processUserConfirmation(session.user);
          } else {
            throw new Error('Nenhuma sessão válida encontrada');
          }
        }

      } catch (error: any) {
        console.error('❌ Erro na confirmação:', error);
        setStatus('error');
        toast({
          title: "Erro na confirmação",
          description: error.message || "Erro ao confirmar conta. Tente fazer login.",
          variant: "destructive"
        });
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => navigate("/login"), 3000);
      } finally {
        setLoading(false);
      }
    };

    const processUserConfirmation = async (user: any) => {
      console.log('👤 Processando usuário:', user.email);
      
      // Recuperar dados do restaurante do localStorage
      const pendingDataStr = localStorage.getItem('pendingRestaurantData');
      if (!pendingDataStr) {
        console.warn('⚠️ Dados do restaurante não encontrados no localStorage');
        toast({
          title: "Aviso",
          description: "Dados do restaurante não encontrados. Você pode cadastrar manualmente no painel.",
        });
        navigate("/admin");
        return;
      }

      const restaurantData = JSON.parse(pendingDataStr);
      console.log('🏪 Dados do restaurante recuperados:', restaurantData.restaurantName);

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
            owner_id: user.id,
            is_active: true
          });

        if (restaurantError) {
          console.error('❌ Erro ao criar restaurante:', restaurantError);
          throw restaurantError;
        }

        console.log('✅ Restaurante criado com sucesso');

        // Limpar dados do localStorage
        localStorage.removeItem('pendingRestaurantData');

        setStatus('success');
        toast({
          title: "🎉 Sucesso!",
          description: `Conta confirmada e estabelecimento "${restaurantData.restaurantName}" cadastrado com sucesso!`,
          duration: 8000
        });

        // Redirecionar para o dashboard admin após 2 segundos
        setTimeout(() => navigate("/admin"), 2000);
        
      } catch (error: any) {
        console.error('❌ Erro ao criar estabelecimento:', error);
        setStatus('error');
        toast({
          title: "Erro ao criar estabelecimento",
          description: error.message || "Ocorreu um erro ao criar o estabelecimento",
          variant: "destructive"
        });
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleAuthConfirmation();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Confirmando sua conta...
              </h2>
              <p className="text-gray-600">
                Aguarde enquanto processamos sua confirmação de email.
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="text-green-500 text-4xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Conta confirmada com sucesso!
              </h2>
              <p className="text-gray-600">
                Redirecionando para o painel administrativo...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Erro na confirmação
              </h2>
              <p className="text-gray-600 mb-4">
                Não foi possível confirmar sua conta.
              </p>
              <button 
                onClick={() => navigate("/login")}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Voltar ao Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailConfirm;