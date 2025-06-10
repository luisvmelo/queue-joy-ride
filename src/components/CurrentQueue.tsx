
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Phone, Users } from "lucide-react";

interface CurrentQueueProps {
  queueData: any[];
  onConfirmArrival: (partyId: string) => void;
  onMarkNoShow: (partyId: string) => void;
}

const CurrentQueue = ({ queueData, onConfirmArrival, onMarkNoShow }: CurrentQueueProps) => {
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

  if (!queueData.length) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Fila vazia</h3>
          <p className="text-gray-600">Quando alguém entrar na lista, aparecerá aqui</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Fila Completa</span>
          </span>
          <Badge variant="outline">
            {queueData.length} {queueData.length === 1 ? 'pessoa' : 'pessoas'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {queueData.map((party, index) => (
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
      </CardContent>
    </Card>
  );
};

export default CurrentQueue;
