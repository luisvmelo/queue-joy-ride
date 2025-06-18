
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Phone, Users, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  
  const waitingParties = queueData.filter(p => p.status === 'waiting');
  const readyParties = queueData.filter(p => p.status === 'ready');
  const currentParty = readyParties[0];

  // Helper function to format time in MM:SS
  const formatWaitTime = (joinedAt: string) => {
    const elapsed = Math.floor((Date.now() - new Date(joinedAt).getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Filter parties based on search query
  const filteredWaitingParties = waitingParties.filter(party =>
    party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.phone.includes(searchQuery)
  );

  const filteredReadyParties = readyParties.filter(party =>
    party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.phone.includes(searchQuery)
  );

  // Use filtered data for display but original data for counts
  const displayWaitingParties = searchQuery ? filteredWaitingParties : waitingParties;
  const displayCurrentParty = searchQuery ? filteredReadyParties[0] : currentParty;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Pesquisar por nome ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Mostrando resultados para "{searchQuery}" • {filteredWaitingParties.length + filteredReadyParties.length} encontrados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Call Next Button */}
      {waitingParties.length > 0 && !searchQuery && (
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
                  Aguardando há {formatWaitTime(waitingParties[0]?.joined_at)}
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
      {displayCurrentParty && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center text-orange-800">
                <Users className="w-5 h-5 mr-2" />
                Cliente Chamado - Aguardando Chegada
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{displayCurrentParty.name}</h3>
                <p className="text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {displayCurrentParty.party_size} {displayCurrentParty.party_size === 1 ? 'pessoa' : 'pessoas'}
                </p>
                <p className="text-gray-600">{displayCurrentParty.phone}</p>
              </div>

              <div className="text-center">
                {displayCurrentParty.notified_ready_at && (
                  <div>
                    <TimeCounter
                      startTime={displayCurrentParty.notified_ready_at}
                      label="Tempo desde a chamada"
                      className="text-orange-600"
                    />
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Tolerância: {displayCurrentParty.tolerance_minutes || 2} min + 30s</p>
                      <p className="text-xs text-gray-500">
                        Remoção automática após este tempo
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => onConfirmArrival(displayCurrentParty.party_id)} 
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Chegada
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {searchQuery && filteredWaitingParties.length === 0 && filteredReadyParties.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-600">Tente pesquisar com um termo diferente</p>
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery("")}
              className="mt-4"
            >
              Limpar pesquisa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Queue Status */}
      {displayWaitingParties.length === 0 && !displayCurrentParty && !searchQuery && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Fila Vazia</h3>
            <p className="text-gray-600">Nenhum cliente aguardando no momento</p>
          </CardContent>
        </Card>
      )}

      {/* Waiting Queue Preview */}
      {displayWaitingParties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {searchQuery ? `Resultados da Pesquisa (${displayWaitingParties.length})` : 'Fila de Espera'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayWaitingParties.slice(0, searchQuery ? displayWaitingParties.length : 10).map((party, index) => (
                <div key={party.party_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {searchQuery ? party.queue_position : (index + (displayCurrentParty ? 2 : 1))}
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
                      Há {formatWaitTime(party.joined_at)}
                    </p>
                  </div>
                </div>
              ))}
              {!searchQuery && displayWaitingParties.length > 10 && (
                <p className="text-center text-gray-500 text-sm">
                  +{displayWaitingParties.length - 10} pessoas na fila
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
