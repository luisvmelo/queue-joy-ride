
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

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

interface ReadyPartiesProps {
  queueData: QueueParty[];
  onConfirmArrival: (partyId: string) => void;
  onMarkNoShow: (partyId: string) => void;
}

const ReadyParties = ({ queueData, onConfirmArrival, onMarkNoShow }: ReadyPartiesProps) => {
  const readyParties = queueData.filter(p => p.status === 'ready');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aguardando Confirmação de Chegada</CardTitle>
      </CardHeader>
      <CardContent>
        {readyParties.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhum cliente aguardando confirmação
          </p>
        ) : (
          <div className="space-y-3">
            {readyParties.map(party => (
              <div key={party.party_id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                <div>
                  <h4 className="font-semibold">{party.name}</h4>
                  <p className="text-sm text-gray-600">
                    {party.party_size} {party.party_size === 1 ? 'pessoa' : 'pessoas'} • {party.phone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onConfirmArrival(party.party_id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Confirmar Chegada
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onMarkNoShow(party.party_id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Não Compareceu
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadyParties;
