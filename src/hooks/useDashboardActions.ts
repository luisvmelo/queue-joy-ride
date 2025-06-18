// src/hooks/useDashboardActions.ts - Atualizado com notificações

import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { handleCallNext as notifyCallNext, handleTableReady } from "@/utils/notifications";

export const useDashboardActions = (restaurantId: string | null, fetchQueueData: () => void) => {
  const { toast } = useToast();

  const handleCallNext = async () => {
    if (!restaurantId) return;

    try {
      // Buscar próximo da fila
      const { data: nextParty, error: queueError } = await supabase
        .from('parties')
        .select('id, name, phone, notification_type')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'waiting')
        .order('queue_position', { ascending: true })
        .limit(1)
        .single();

      if (queueError || !nextParty) {
        toast({
          title: "Fila vazia",
          description: "Não há clientes aguardando na fila",
        });
        return;
      }

      // Chamar próximo e enviar notificação
      const result = await notifyCallNext(nextParty.id);

      if (result.success) {
        let description = `${nextParty.name} foi chamado`;
        
        if (result.notificationSent) {
          const method = (result as any).method || 'desconhecido';
          description += ` e notificado via ${method === 'whatsapp' ? 'WhatsApp' : 'SMS'}`;
        } else {
          description += `, mas houve problema na notificação`;
        }

        toast({
          title: "Próximo chamado! 📞",
          description,
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível chamar o próximo",
          variant: "destructive"
        });
      }

      fetchQueueData();
    } catch (error) {
      console.error('Error calling next:', error);
      toast({
        title: "Erro",
        description: "Erro ao chamar próximo cliente",
        variant: "destructive"
      });
    }
  };

  const handleConfirmArrival = async (partyId: string) => {
    try {
      console.log('Confirming arrival for party:', partyId);
      
      const { error } = await supabase
        .from('parties')
        .update({ 
          status: 'seated',
          seated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', partyId);

      if (error) throw error;

      toast({
        title: "Chegada confirmada ✅",
        description: "Cliente foi acomodado com sucesso",
      });
      
      fetchQueueData();
    } catch (error) {
      console.error('Error confirming arrival:', error);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a chegada",
        variant: "destructive"
      });
    }
  };

  const handleMarkNoShow = async (partyId: string) => {
    try {
      console.log('Marking no-show for party:', partyId);
      
      const { error } = await supabase
        .from('parties')
        .update({ 
          status: 'no_show',
          removed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', partyId);

      if (error) throw error;

      toast({
        title: "Marcado como ausente",
        description: "Cliente foi marcado como não compareceu",
      });
      
      fetchQueueData();
    } catch (error) {
      console.error('Error marking no-show:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar como ausente",
        variant: "destructive"
      });
    }
  };

  // Nova função para marcar mesa como pronta e notificar
  const handleMarkTableReady = async (partyId: string) => {
    try {
      // Buscar dados da party
      const { data: party, error: partyError } = await supabase
        .from('parties')
        .select('name, notification_type')
        .eq('id', partyId)
        .single();

      if (partyError || !party) {
        toast({
          title: "Erro",
          description: "Cliente não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Marcar como pronto e enviar notificação
      const result = await handleTableReady(partyId);

      if (result.success) {
        let description = `Mesa de ${party.name} está pronta`;
        
        if (result.notificationSent) {
          const method = (result as any).method || 'desconhecido';
          description += ` e foi notificado via ${method === 'whatsapp' ? 'WhatsApp' : 'SMS'}`;
        } else {
          description += `, mas houve problema na notificação`;
        }

        toast({
          title: "Mesa pronta! 🍽️",
          description,
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível marcar mesa como pronta",
          variant: "destructive"
        });
      }

      fetchQueueData();
    } catch (error) {
      console.error('Error marking table ready:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar mesa como pronta",
        variant: "destructive"
      });
    }
  };

  const handleSendNotification = async (partyId: string, message: string) => {
    try {
      // Implementação futura para mensagens customizadas
      toast({
        title: "Notificação personalizada",
        description: "Funcionalidade em desenvolvimento",
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar notificação",
        variant: "destructive"
      });
    }
  };

  const handleSendBulkNotification = async (message: string) => {
    try {
      // Implementação futura para notificações em massa
      toast({
        title: "Notificação em massa",
        description: "Funcionalidade em desenvolvimento",
      });
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar notificações",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      // Limpar dados de recepcionista se existirem
      const receptionistRestaurant = localStorage.getItem('receptionist_restaurant');
      if (receptionistRestaurant) {
        localStorage.removeItem(`receptionist_access_${receptionistRestaurant}`);
        localStorage.removeItem('receptionist_restaurant');
      }
      
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    handleCallNext,
    handleConfirmArrival,
    handleMarkNoShow,
    handleMarkTableReady, // Nova função
    handleSendNotification,
    handleSendBulkNotification,
    handleSignOut
  };
};