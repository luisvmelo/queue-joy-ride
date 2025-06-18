// 📱 SISTEMA DE NOTIFICAÇÕES SIMPLIFICADO
// src/utils/notifications.ts

import { supabase } from "@/integrations/supabase/client";

// 📝 Templates de mensagem
export const getNotificationMessage = (
  name: string, 
  restaurantName: string, 
  type: 'next' | 'ready'
): string => {
  
  if (type === 'next') {
    return `🔔 Olá ${name}! Você é o próximo na fila do ${restaurantName}. Prepare-se, sua mesa estará pronta em breve! 😊`;
  }
  
  if (type === 'ready') {
    return `🎉 ${name}, sua mesa no ${restaurantName} está pronta! Dirija-se ao restaurante agora. Você tem alguns minutos para chegar. Obrigado pela espera! 🍽️`;
  }
  
  return `📱 ${name}, atualização da fila do ${restaurantName}.`;
};

// 💬 WhatsApp via link direto (funciona perfeitamente)
export const sendWhatsAppNotification = (phone: string, message: string): boolean => {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
    
    // Abrir WhatsApp (funciona em mobile e desktop)
    window.open(whatsappUrl, '_blank');
    return true;
  } catch (error) {
    console.error('Erro ao abrir WhatsApp:', error);
    return false;
  }
};

// 📱 SMS via navegador (abre app de SMS)
export const sendSMSNotification = (phone: string, message: string): boolean => {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const smsUrl = `sms:+55${cleanPhone}?body=${encodeURIComponent(message)}`;
    
    // Abrir app de SMS
    window.open(smsUrl, '_self');
    return true;
  } catch (error) {
    console.error('Erro ao abrir SMS:', error);
    return false;
  }
};

// 🔔 Função principal para notificar cliente
export const notifyCustomer = async (
  partyId: string,
  notificationType: 'next' | 'ready'
): Promise<{ success: boolean; notificationSent: boolean; method: string }> => {
  
  try {
    // Buscar dados da party
    const { data: party, error } = await supabase
      .from('parties')
      .select(`
        name,
        phone,
        notification_type,
        restaurants!parties_restaurant_id_fkey(name)
      `)
      .eq('id', partyId)
      .single();

    if (error || !party) {
      console.error('Party não encontrada:', error);
      return { success: false, notificationSent: false, method: 'none' };
    }

    const restaurantName = (party.restaurants as any)?.name || 'Restaurante';
    const message = getNotificationMessage(
      party.name,
      restaurantName,
      notificationType
    );

    let notificationSent = false;
    let method = 'none';

    // Enviar baseado na preferência do cliente
    if (party.notification_type === 'whatsapp') {
      notificationSent = sendWhatsAppNotification(party.phone, message);
      method = 'whatsapp';
    } else {
      notificationSent = sendSMSNotification(party.phone, message);
      method = 'sms';
    }

    return {
      success: true,
      notificationSent,
      method
    };

  } catch (error) {
    console.error('Erro ao notificar cliente:', error);
    return { success: false, notificationSent: false, method: 'error' };
  }
};

// 📞 Função para chamar próximo cliente
export const handleCallNext = async (partyId: string) => {
  try {
    // Atualizar status no banco
    const { error } = await supabase
      .from('parties')
      .update({ 
        status: 'next',
        notified_next_at: new Date().toISOString()
      })
      .eq('id', partyId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return { success: false, notificationSent: false };
    }

    // Enviar notificação
    const result = await notifyCustomer(partyId, 'next');
    
    return result;

  } catch (error) {
    console.error('Erro ao chamar próximo:', error);
    return { success: false, notificationSent: false, method: 'error' };
  }
};

// 🍽️ Função para marcar mesa como pronta
export const handleTableReady = async (partyId: string) => {
  try {
    // Atualizar status no banco
    const { error } = await supabase
      .from('parties')
      .update({ 
        status: 'ready',
        notified_ready_at: new Date().toISOString()
      })
      .eq('id', partyId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return { success: false, notificationSent: false };
    }

    // Enviar notificação
    const result = await notifyCustomer(partyId, 'ready');
    
    return result;

  } catch (error) {
    console.error('Erro ao marcar mesa como pronta:', error);
    return { success: false, notificationSent: false, method: 'error' };
  }
};