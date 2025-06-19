
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const [user, setUser] = useState<{ id: string; email: string; type?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    const checkUser = async () => {
      // Verificar se é acesso de recepcionista primeiro
      const receptionistRestaurant = localStorage.getItem('receptionist_restaurant') || sessionStorage.getItem('receptionist_restaurant');
      const receptionistAccess = receptionistRestaurant ? 
        localStorage.getItem(`receptionist_access_${receptionistRestaurant}`) || 
        sessionStorage.getItem(`receptionist_access_${receptionistRestaurant}`) : null;
      
      if (receptionistAccess && receptionistRestaurant) {
        // Recepcionista está logada
        setUser({ id: 'receptionist', email: 'receptionist@local', type: 'receptionist' });
        setLoading(false);
        return;
      }

      // Verificar autenticação normal do Supabase
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkUser();

    // Escutar mudanças de autenticação apenas para Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Verificar novamente se é recepcionista antes de atualizar
        const receptionistRestaurant = localStorage.getItem('receptionist_restaurant') || sessionStorage.getItem('receptionist_restaurant');
        const receptionistAccess = receptionistRestaurant ? 
          localStorage.getItem(`receptionist_access_${receptionistRestaurant}`) || 
          sessionStorage.getItem(`receptionist_access_${receptionistRestaurant}`) : null;
        
        if (receptionistAccess && receptionistRestaurant) {
          // Manter usuário da recepcionista
          setUser({ id: 'receptionist', email: 'receptionist@local', type: 'receptionist' });
        } else {
          setUser(session?.user || null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-center text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
