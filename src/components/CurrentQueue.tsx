
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Clock, Phone, Users, Search, Send } from "lucide-react";

interface CurrentQueueProps {
  queueData: any[];
  onConfirmArrival: (partyId: string) => void;
  onMarkNoShow: (partyId: string) => void;
  onSendNotification?: (partyId: string, message: string) => void;
  onSendBulkNotification?: (message: string) => void;
}

const CurrentQueue = ({ 
  queueData, 
  onConfirmArrival, 
  onMarkNoShow, 
  onSendNotification,
  onSendBulkNotification 
}: CurrentQueueProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedPartyForNotification, setSelectedPartyForNotification] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary">Aguardando</Badge>;
      case 'next':
        return <Badge className="bg-yellow-100 text-yellow-800">Próximo</Badge>;
      case 'ready':
        return <Badge className="bg-orange-100 text-orange-800">É a vez!</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatWaitTime = (joinedAt: string) => {
    const joined = new Date(joinedAt);
    const now = new Date();
    const diffMs = now.getTime() - joined.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  };

  // Filter queue data based on search term
  const filteredQueueData = queueData.filter(party => 
    party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    party.phone.includes(searchTerm) ||
    party.queue_position.toString().includes(searchTerm)
  );

  const handleSendNotification = () => {
    if (!notificationMessage.trim()) return;

    if (selectedPartyForNotification) {
      onSendNotification?.(selectedPartyForNotification, notificationMessage);
    } else {
      onSendBulkNotification?.(notificationMessage);
    }

    setNotificationMessage("");
    setSelectedPartyForNotification(null);
    setShowNotificationPanel(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Fila Completa</span>
            </span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {queueData.length} {queueData.length === 1 ? 'pessoa' : 'pessoas'}
              </Badge>
              <Button
                onClick={() => {
                  setSelectedPartyForNotification(null);
                  setShowNotificationPanel(true);
                }}
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Send className="w-4 h-4 mr-1" />
                Notificar Todos
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Bar - Always visible */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, telefone ou posição na fila..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && queueData.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {filteredQueueData.length} {filteredQueueData.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
              </p>
            )}
          </div>

          {/* Notification Panel - Always visible when opened */}
          {showNotificationPanel && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3">
                {selectedPartyForNotification ? 'Enviar Notificação Individual' : 'Enviar Notificação para Todos'}
              </h4>
              <div className="space-y-3">
                <Input
                  placeholder="Digite sua mensagem... (ex: Restaurante fechará em 10 minutos)"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSendNotification}
                    size="sm"
                    disabled={!notificationMessage.trim()}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Enviar
                  </Button>
                  <Button
                    onClick={() => setShowNotificationPanel(false)}
                    size="sm"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!queueData.length ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Fila vazia</h3>
              <p className="text-gray-600 mb-4">Quando alguém entrar na lista, aparecerá aqui</p>
              <p className="text-sm text-gray-500">
                Você pode usar a busca e as opções de notificação mesmo quando há pessoas na fila
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueueData.map((party, index) => (
                <div 
                  key={party.party_id}
                  className={`p-4 border rounded-lg ${
                    party.status === 'ready' 
                      ? 'border-orange-200 bg-orange-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        party.status === 'ready' 
                          ? 'bg-orange-100 text-orange-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        <span className="font-semibold">{party.queue_position}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{party.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{party.phone}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{party.party_size} {party.party_size === 1 ? 'pessoa' : 'pessoas'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>há {formatWaitTime(party.joined_at)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(party.status)}
                      <Button
                        onClick={() => {
                          setSelectedPartyForNotification(party.party_id);
                          setShowNotificationPanel(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {party.status === 'ready' && (
                    <div className="flex space-x-2 pt-3 border-t">
                      <Button 
                        onClick={() => onConfirmArrival(party.party_id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirmar
                      </Button>
                      <Button 
                        onClick={() => onMarkNoShow(party.party_id)}
                        size="sm"
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Ausente
                      </Button>
                    </div>
                  )}

                  {party.notified_ready_at && (
                    <div className="mt-2 text-xs text-gray-500">
                      Notificado às {new Date(party.notified_ready_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentQueue;
