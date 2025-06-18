import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Bug } from "lucide-react";

const CheckIn = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    partySize: "",
  });

  // Função para adicionar logs visuais
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLogs(prev => [...prev.slice(-10), logMessage]); // Manter apenas os últimos 10 logs
  };

  useEffect(() => {
    addDebugLog('🎯 CheckIn component mounted');
    addDebugLog(`📍 Restaurant ID: ${restaurantId}`);
    addDebugLog(`🌐 Current URL: ${window.location.href}`);
    
    if (!restaurantId) {
      addDebugLog('❌ No restaurantId, redirecting to restaurants');
      navigate("/restaurants");
      return;
    }
    fetchRestaurant();
  }, [restaurantId, navigate]);

  const fetchRestaurant = async () => {
    try {
      addDebugLog('🔄 Fetching restaurant data...');
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      addDebugLog(`✅ Restaurant fetched: ${data.name}`);
      setRestaurant(data);
    } catch (error: any) {
      addDebugLog(`❌ Error fetching restaurant: ${error.message}`);
      toast({
        title: "Erro",
        description: "Restaurante não encontrado ou inativo",
        variant: "destructive"
      });
      navigate("/restaurants");
    }
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s()+-]+$/;
    const cleanPhone = phone.replace(/\s/g, '');
    return phoneRegex.test(phone) && cleanPhone.length >= 10 && cleanPhone.length <= 15;
  };

  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>"/\\]/g, '').trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    addDebugLog('🚀 === FORM SUBMISSION STARTED ===');
    addDebugLog(`📝 Form data: ${JSON.stringify(formData)}`);

    // Validate inputs
    if (!formData.name.trim()) {
      addDebugLog('❌ Validation failed: Name is required');
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(formData.phone)) {
      addDebugLog('❌ Validation failed: Invalid phone');
      toast({
        title: "Erro",
        description: "Telefone deve ter entre 10 e 15 dígitos",
        variant: "destructive"
      });
      return;
    }

    const partySizeNum = parseInt(formData.partySize) || 0;
    if (partySizeNum < 1 || partySizeNum > 20) {
      addDebugLog('❌ Validation failed: Invalid party size');
      toast({
        title: "Erro",
        description: "Número de pessoas deve estar entre 1 e 20",
        variant: "destructive"
      });
      return;
    }

    addDebugLog('✅ All validations passed');
    setLoading(true);

    try {
      const sanitizedName = sanitizeInput(formData.name);
      const sanitizedPhone = formData.phone.replace(/[^\d+\-\s()]/g, '');

      addDebugLog(`🧹 Sanitized data: name="${sanitizedName}", phone="${sanitizedPhone}", size=${partySizeNum}`);

      const rpcData = {
        p_restaurant_id: restaurantId,
        p_name: sanitizedName,
        p_phone: sanitizedPhone,
        p_party_size: partySizeNum,
        p_notification_type: 'sms'
      };

      addDebugLog(`📡 Calling RPC with: ${JSON.stringify(rpcData)}`);

      const { data, error } = await supabase.rpc('create_customer_party', rpcData);

      addDebugLog(`📥 RPC Response - Data: ${JSON.stringify(data)}`);
      addDebugLog(`📥 RPC Response - Error: ${JSON.stringify(error)}`);

      if (error) {
        addDebugLog(`❌ RPC Error: ${error.message}`);
        throw error;
      }

      if (data && data.length > 0) {
        const { party_id, queue_position } = data[0];
        
        addDebugLog(`🎉 Party created! ID: ${party_id}, Position: ${queue_position}`);
        
        // Armazenar credenciais
        const phoneKey = `party_${party_id}_phone`;
        const nameKey = `party_${party_id}_name`;
        
        addDebugLog(`💾 Storing credentials with keys: ${phoneKey}, ${nameKey}`);
        
        localStorage.setItem(phoneKey, sanitizedPhone);
        localStorage.setItem(nameKey, sanitizedName);
        
        // Verificar se foi armazenado
        const storedPhone = localStorage.getItem(phoneKey);
        const storedName = localStorage.getItem(nameKey);
        
        addDebugLog(`🔍 Verification - Phone stored: ${storedPhone === sanitizedPhone ? '✅' : '❌'}`);
        addDebugLog(`🔍 Verification - Name stored: ${storedName === sanitizedName ? '✅' : '❌'}`);

        if (!storedPhone || !storedName || storedPhone !== sanitizedPhone || storedName !== sanitizedName) {
          addDebugLog('❌ CRITICAL: Credentials not stored correctly!');
          throw new Error('Falha ao armazenar credenciais. Tente novamente.');
        }

        // Toast de sucesso
        toast({
          title: "Entrada na fila confirmada! 🎉",
          description: `Você está na posição ${queue_position} da fila.`,
          duration: 3000
        });

        // Redirecionamento
        const statusUrl = `/status/${party_id}`;
        addDebugLog(`🎯 Target URL: ${statusUrl}`);
        addDebugLog(`🌐 Full URL will be: ${window.location.origin}${statusUrl}`);
        
        addDebugLog('🔄 Attempting React Router navigation...');
        
        try {
          navigate(statusUrl, { replace: true });
          addDebugLog('✅ Navigate called successfully');
          
          // Verificar após delay
          setTimeout(() => {
            const currentPath = window.location.pathname;
            addDebugLog(`🔍 Current path after navigate: ${currentPath}`);
            addDebugLog(`🔍 Expected path: ${statusUrl}`);
            
            if (currentPath !== statusUrl) {
              addDebugLog('⚠️ React Router failed, using window.location fallback');
              window.location.href = statusUrl;
            } else {
              addDebugLog('🎉 Navigation successful!');
            }
          }, 300);
          
        } catch (navigationError: any) {
          addDebugLog(`❌ Navigation error: ${navigationError.message}`);
          window.location.href = statusUrl;
        }

        // Fallback final
        setTimeout(() => {
          const currentPath = window.location.pathname;
          if (currentPath !== statusUrl) {
            addDebugLog('🔄 Final fallback executing...');
            window.location.replace(statusUrl);
          }
        }, 1000);

      } else {
        addDebugLog('❌ No data returned from RPC');
        throw new Error('Nenhum dado retornado da criação da party');
      }
    } catch (error: any) {
      addDebugLog(`💥 ERROR: ${error.message}`);
      toast({
        title: "Erro",
        description: error.message || "Erro ao entrar na fila",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Debug Toggle Button */}
        <Button
          onClick={() => setShowDebug(!showDebug)}
          variant="outline"
          size="sm"
          className="mb-4 w-full"
        >
          <Bug className="w-4 h-4 mr-2" />
          {showDebug ? 'Ocultar' : 'Mostrar'} Debug Logs
        </Button>

        {/* Debug Panel */}
        {showDebug && (
          <Card className="mb-4 bg-black text-green-400 text-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">🐛 Debug Logs</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-40 overflow-y-auto font-mono">
                {debugLogs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))}
              </div>
              <Button
                onClick={() => setDebugLogs([])}
                variant="secondary"
                size="sm"
                className="mt-2 w-full"
              >
                Limpar Logs
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              {restaurant.name}
            </CardTitle>
            <CardDescription>
              Entre na fila virtual e aguarde ser chamado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={loading}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usado para notificações sobre sua posição na fila
                </p>
              </div>

              <div>
                <Label htmlFor="partySize">Número de pessoas *</Label>
                <Input
                  id="partySize"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Digite o número de pessoas"
                  value={formData.partySize}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 20)) {
                      setFormData({ ...formData, partySize: value });
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  required
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando na fila...
                  </>
                ) : (
                  "Entrar na Fila"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/restaurants")}
                className="w-full"
                disabled={loading}
              >
                Voltar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckIn;