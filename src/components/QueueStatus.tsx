import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, CheckCircle, PhoneCall } from "lucide-react";
import { useEffect, useState } from "react";

interface QueueStatusProps {
  queueData: any[];
  onConfirmArrival: (partyId: string) => void;
  onMarkNoShow: (partyId: string) => void;
  onCallNext?: () => void;
}

const QueueStatus = ({
  queueData,
  onConfirmArrival,
  onMarkNoShow,
  onCallNext
}: QueueStatusProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const currentParty = queueData.find(party => party.status === 'ready') || queueData[0];
  const waitingParties = queueData.filter(party => party.status === 'waiting');
  const nextParties = waitingParties.slice(0, 3);

  useEffect(() => {
    if (currentParty?.notified_ready_at) {
      const notifiedTime = new Date(currentParty.notified_ready_at);
      const toleranceMs = (currentParty.tolerance_minutes || 2) * 60 * 1000;
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = now.getTime() - notifiedTime.getTime();
        const remaining = Math.max(0, toleranceMs - elapsed);
        setTimeLeft(Math.ceil(remaining / 1000));
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentParty]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!queueData.length) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma pessoa na fila</h3>
          <p className="text-gray-600">Quando alguém entrar na lista, aparecerá aqui</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Call Next Button - Always visible when there are waiting parties */}
      {waitingParties.length > 0 && !currentParty && onCallNext && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="text-center py-6">
            <Button
              size="lg"
              onClick={onCallNext}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 text-lg"
            >
              <PhoneCall className="w-6 h-6 mr-3" />
              Chamar Próximo da Fila
              <span className="ml-3 bg-white text-green-600 px-3 py-1 rounded-full text-base font-bold">
                {waitingParties.length}
              </span>
            </Button>
            <p className="text-green-700 mt-2 font-medium">
              {waitingParties[0]?.name} será chamado
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Party */}
      {currentParty && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>É a vez!</span>
              </span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {currentParty.status === 'ready' ? 'Notificado' : 'Aguardando'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-lg">{currentParty.name}</h3>
                <p className="text-gray-600 flex items-center space-x-1">
                  <span>{currentParty.phone}</span>
                </p>
                <p className="text-gray-600">
                  {currentParty.party_size} {currentParty.party_size === 1 ? 'pessoa' : 'pessoas'}
                </p>
              </div>

              {currentParty.status === 'ready' && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {timeLeft > 0 ? 'Tempo restante' : 'Tempo esgotado'}
                  </p>
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={() => onConfirmArrival(currentParty.party_id)} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Chegada
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next in Line */}
      {nextParties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Próximos na Fila</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextParties.map((party, index) => (
                <div key={party.party_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {index + (currentParty ? 2 : 1)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{party.name}</h4>
                      <p className="text-sm text-gray-600">
                        {party.party_size} {party.party_size === 1 ? 'pessoa' : 'pessoas'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {party.phone}
                    </p>
                    <p className="text-xs text-gray-500">
                      Na fila há {Math.floor((new Date().getTime() - new Date(party.joined_at).getTime()) / (1000 * 60))} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">{queueData.length}</div>
            <p className="text-sm text-gray-600">Total na Fila</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold text-green-600">
              {queueData.filter(p => p.status === 'ready').length}
            </div>
            <p className="text-sm text-gray-600">Chamados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(queueData.length * 15)} min
            </div>
            <p className="text-sm text-gray-600">Tempo Estimado</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QueueStatus;
