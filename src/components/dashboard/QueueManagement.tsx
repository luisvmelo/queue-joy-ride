
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Phone, Users, Clock } from "lucide-react";
import TimeCounter from "@/components/TimeCounter";

interface QueueParty {
  party_id: string;
  name: string;
  phone: string;
  party_size: number;
  status: string;
  queue_position: number;
  joined_at: string;
  notified_ready_at: string | null;
  tolerance_minutes: number;
}

interface QueueManagementProps {
  queueData: QueueParty[];
  onCallNext: () => void;
  onConfirmArrival: (partyId: string) => void;
  onMarkNoShow: (partyId: string) => void;
}

const QueueManagement = ({
  queueData,
  onCallNext,
  onConfirmArrival,
  onMarkNoShow
}: QueueManagementProps) => {
  const waitingParties = queueData.filter(p => p.status === 'waiting');
  const readyParties = queueData.filter(p => p.status === 'ready');
  const currentParty = readyParties[0];

  return (
    <div className="space-y-6">
      {/* Call Next Button */}
      {waitingParties.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Próximo na Fila
                </h3>
                <p className="text-green-700">
                  {waitingParties[0]?.name} - {waitingParties[0]?.party_size} pessoas
                </p>
                <p className="text-sm text-green-600">
                  Aguardando há {Math.floor((Date.now() - new Date(waitingParties[0]?.joined_at).getTime()) / 60000)} minutos
                </p>
              </div>
              <Button
                size="lg"
                onClick={onCallNext}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4"
              >
                <Phone className="w-5 h-5 mr-2" />
                Chamar Próximo
                <span className="ml-2 bg-white text-green-600 px-2 py-1 rounded-full text-sm font-bold">
                  {waitingParties.length}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Party Ready */}
      {currentParty && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center text-orange-800">
                <Clock className="w-5 h-5 mr-2" />
                Cliente Chamado - Aguardando Chegada
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{currentParty.name}</h3>
                <p className="text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {currentParty.party_size} {currentParty.party_size === 1 ? 'pessoa' : 'pessoas'}
                </p>
                <p className="text-gray-600">{currentParty.phone}</p>
              </div>

              <div className="text-center">
                {currentParty.notified_ready_at && (
                  <TimeCounter
                    startTime={currentParty.notified_ready_at}
                    label="Tempo desde a chamada"
                    className="text-orange-600"
                  />
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => onConfirmArrival(currentParty.party_id)} 
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Chegada
                </Button>
                <Button 
                  onClick={() => onMarkNoShow(currentParty.party_id)}
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Não Compareceu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Status */}
      {waitingParties.length === 0 && !currentParty && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Fila Vazia</h3>
            <p className="text-gray-600">Nenhum cliente aguardando no momento</p>
          </CardContent>
        </Card>
      )}

      {/* Waiting Queue Preview */}
      {waitingParties.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Próximos na Fila</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {waitingParties.slice(1, 4).map((party, index) => (
                <div key={party.party_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {index + 2}
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
                      Há {Math.floor((Date.now() - new Date(party.joined_at).getTime()) / 60000)} min
                    </p>
                  </div>
                </div>
              ))}
              {waitingParties.length > 4 && (
                <p className="text-center text-gray-500 text-sm">
                  +{waitingParties.length - 4} pessoas na fila
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QueueManagement;
