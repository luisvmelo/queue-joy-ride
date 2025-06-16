
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, AlertCircle } from "lucide-react";

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

interface Stats {
  totalInQueue: number;
  avgWaitTime: number;
  servedToday: number;
  nextInLine: QueueParty | null;
}

interface StatsCardsProps {
  stats: Stats;
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total na Fila</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalInQueue}</div>
          <p className="text-xs text-muted-foreground">pessoas aguardando</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgWaitTime}min</div>
          <p className="text-xs text-muted-foreground">por atendimento</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Atendidos Hoje</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.servedToday}</div>
          <p className="text-xs text-muted-foreground">clientes atendidos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximo da Fila</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold truncate">
            {stats.nextInLine?.name || 'Fila vazia'}
          </div>
          {stats.nextInLine && (
            <p className="text-xs text-muted-foreground">
              {stats.nextInLine.party_size} {stats.nextInLine.party_size === 1 ? 'pessoa' : 'pessoas'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
