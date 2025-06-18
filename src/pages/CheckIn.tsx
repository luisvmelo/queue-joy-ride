import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";

const CheckIn = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    partySize: "",
    notificationType: "sms", // Padrão SMS
  });

  useEffect(() => {
    if (!restaurantId) {
      navigate("/restaurants");
      return;
    }
    testDatabaseConnection();
    fetchRestaurant();
  }, [restaurantId, navigate]);

  const testDatabaseConnection = async () => {
    try {
      console.log('🔧 Testing database connection...');
      const { data, error } = await supabase.rpc('test_database_connection');
      
      if (error) {
        console.error('❌ Database connection test failed:', error);
      } else {
        console.log('✅ Database connection test passed:', data);
      }
      
      // Also test simple table access
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', restaurantId)
        .single();
        
      if (restaurantError) {
        console.error('❌ Restaurant table access failed:', restaurantError);
      } else {
        console.log('✅ Restaurant table access successful:', restaurantData);
      }
    } catch (error) {
      console.error('❌ Connection test error:', error);
    }
  };

  const fetchRestaurant = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setRestaurant(data);
    } catch (error: any) {
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

    // Validate inputs
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast({
        title: "Erro",
        description: "Telefone deve ter entre 10 e 15 dígitos",
        variant: "destructive"
      });
      return;
    }

    const partySizeNum = parseInt(formData.partySize) || 0;
    if (partySizeNum < 1 || partySizeNum > 20) {
      toast({
        title: "Erro",
        description: "Número de pessoas deve estar entre 1 e 20",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Starting check-in process...');
      console.log('📝 Form data:', formData);
      console.log('🏪 Restaurant ID:', restaurantId);
      
      const sanitizedName = sanitizeInput(formData.name);
      const sanitizedPhone = formData.phone.replace(/[^\d+\-\s()]/g, '');

      console.log('🧼 Sanitized data:', {
        name: sanitizedName,
        phone: sanitizedPhone,
        partySize: partySizeNum,
        notificationType: formData.notificationType
      });

      console.log('📞 Calling create_customer_party RPC function...');
      const { data, error } = await supabase
        .rpc('create_customer_party', {
          p_restaurant_id: restaurantId,
          p_name: sanitizedName,
          p_phone: sanitizedPhone,
          p_party_size: partySizeNum,
          p_notification_type: formData.notificationType
        });

      console.log('📊 RPC Response:', { data, error });

      if (error) {
        console.error('❌ RPC Error details:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const { party_id, queue_position } = data[0];
        
        // Armazenar credenciais
        const phoneKey = `party_${party_id}_phone`;
        const nameKey = `party_${party_id}_name`;
        
        localStorage.setItem(phoneKey, sanitizedPhone);
        localStorage.setItem(nameKey, sanitizedName);
        
        // Verificar se foi armazenado
        const storedPhone = localStorage.getItem(phoneKey);
        const storedName = localStorage.getItem(nameKey);

        if (!storedPhone || !storedName || storedPhone !== sanitizedPhone || storedName !== sanitizedName) {
          throw new Error('Falha ao armazenar credenciais. Tente novamente.');
        }

        // Toast de sucesso com mensagem personalizada
        toast({
          title: "🎉 Bem-vindo à fila virtual!",
          description: `Olá ${sanitizedName}! Você está na posição ${queue_position} da fila do ${restaurant.name}. Relaxe e aguarde - avisaremos quando sua mesa estiver pronta!`,
          duration: 5000
        });

        // Redirecionamento
        const statusUrl = `/status/${party_id}`;
        const fullStatusUrl = `${window.location.origin}${statusUrl}`;
        
        try {
          navigate(statusUrl, { replace: true });
          
          setTimeout(() => {
            const currentPath = window.location.pathname;
            if (currentPath !== statusUrl) {
              window.location.href = fullStatusUrl;
            }
          }, 1000);
          
        } catch (navigationError: any) {
          window.location.href = fullStatusUrl;
        }

        // Fallback final
        setTimeout(() => {
          const currentPath = window.location.pathname;
          if (currentPath !== statusUrl) {
            try {
              window.location.replace(fullStatusUrl);
            } catch (e) {
              window.location.assign(fullStatusUrl);
            }
          }
        }, 2000);

      } else {
        throw new Error('Nenhum dado retornado da criação da party');
      }
    } catch (error: any) {
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

              <div>
                <Label htmlFor="notificationType">Como prefere ser notificado? *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, notificationType: 'sms' })}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.notificationType === 'sms'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <div className="text-2xl mb-1">📱</div>
                    <div className="font-medium">SMS</div>
                    <div className="text-xs text-gray-500">Mensagem de texto</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, notificationType: 'whatsapp' })}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.notificationType === 'whatsapp'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <div className="text-2xl mb-1">💬</div>
                    <div className="font-medium">WhatsApp</div>
                    <div className="text-xs text-gray-500">Mensagem no WhatsApp</div>
                  </button>
                </div>
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