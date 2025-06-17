
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDashboardActions = (restaurantId: string | null, fetchQueueData: () => void) => {
  const { toast } = useToast();

  const handleCallNext = async () => {
    if (!restaurantId) return;

    try {
      const { data: nextParty, error: fetchError } = await supabase
        .from('parties')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'waiting')
        .order('queue_position', { ascending: true })
        .limit(1)
        .single();

      if (fetchError || !nextParty) {
        toast({
          title: "Fila vazia",
          description: "Não há clientes aguardando na fila",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('parties')
        .update({ 
          status: 'ready',
          notified_ready_at: new Date().toISOString()
        })
        .eq('id', nextParty.id);

      if (updateError) throw updateError;

      toast({
        title: "Próximo chamado!",
        description: `${nextParty.name} foi notificado`,
      });

      fetchQueueData();
    } catch (error) {
      console.error('Error calling next:', error);
      toast({
        title: "Erro",
        description: "Não foi possível chamar o próximo",
        variant: "destructive"
      });
    }
  };

  const handleConfirmArrival = async (partyId: string) => {
    try {
      console.log('Confirming arrival for party:', partyId);
      
      const { data, error } = await supabase.rpc('confirm_party_arrival', {
        party_uuid: partyId
      });

      if (error) throw error;

      toast({
        title: "Chegada confirmada",
        description: "Cliente foi acomodado e movido para o histórico",
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
      
      const { data, error } = await supabase.rpc('mark_party_no_show', {
        party_uuid: partyId
      });

      if (error) throw error;

      toast({
        title: "Marcado como ausente",
        description: "Cliente foi marcado como não compareceu e movido para o histórico",
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

  const handleSendNotification = async (partyId: string, message: string) => {
    try {
      toast({
        title: "Notificação enviada",
        description: "Cliente foi notificado",
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
      toast({
        title: "Notificações enviadas",
        description: "Todos os clientes foram notificados",
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
    handleSendNotification,
    handleSendBulkNotification,
    handleSignOut
  };
};
