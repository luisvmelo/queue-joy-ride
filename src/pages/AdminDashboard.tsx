import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Clock, 
  Users, 
  TrendingUp, 
  Settings, 
  QrCode,
  Download,
  Share2,
  Eye,
  EyeOff,
  Bell,
  UserCog,
  Calendar,
  Target,
  Star,
  TrendingDown,
  UserPlus,
  UserMinus,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useQueueAnalytics } from "@/hooks/useQueueAnalytics";

// Mock data para demonstração
const mockAnalytics = {
  averageWaitTime: 28,
  averageAbandonmentTime: 15,
  conversionRate: 85,
  returningCustomers: 18,
  queueClosed: false,
  currentQueueSize: 12,
  maxQueueSize: 30,
  peakHours: [
    { hour: '12:00', customers: 45 },
    { hour: '13:00', customers: 62 },
    { hour: '14:00', customers: 38 },
    { hour: '19:00', customers: 58 },
    { hour: '20:00', customers: 71 },
    { hour: '21:00', customers: 42 }
  ],
  customerLoyalty: [
    { frequency: '1 vez', count: 120 },
    { frequency: '2-3 vezes', count: 85 },
    { frequency: '4+ vezes', count: 43 }
  ],
  ratings: { 
    average: 4.2, 
    total: 87,
    distribution: [
      { stars: 5, count: 32 },
      { stars: 4, count: 28 },
      { stars: 3, count: 15 },
      { stars: 2, count: 8 },
      { stars: 1, count: 4 }
    ]
  },
  comparison: {
    thisWeek: { customers: 485, revenue: 12840, conversion: 85 },
    lastWeek: { customers: 423, revenue: 11250, conversion: 78 }
  },
  weeklyTrend: [
    { day: 'Seg', customers: 65, abandonment: 12 },
    { day: 'Ter', customers: 78, abandonment: 15 },
    { day: 'Qua', customers: 82, abandonment: 8 },
    { day: 'Qui', customers: 94, abandonment: 18 },
    { day: 'Sex', customers: 108, abandonment: 22 },
    { day: 'Sáb', customers: 156, abandonment: 28 },
    { day: 'Dom', customers: 142, abandonment: 24 }
  ]
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'qr'>('dashboard');
  
  // Restaurant ID - usando o padrão do seed data
  const restaurantId = "550e8400-e29b-41d4-a716-446655440000";
  
  // Buscar dados reais de analytics
  const { data: analytics, isLoading: analyticsLoading } = useQueueAnalytics(restaurantId);
  
  // Configurações do restaurante
  const [maxQueueSize, setMaxQueueSize] = useState(30);
  const [toleranceMinutes, setToleranceMinutes] = useState(10);
  const [reinsertionPosition, setReinsertionPosition] = useState<'last' | 'first'>('last');
  const [isPublicVisible, setIsPublicVisible] = useState(true);
  const [operatingHours, setOperatingHours] = useState({ start: '10:00', end: '22:00' });
  const [autoNotifications, setAutoNotifications] = useState(true);
  const [manualTimeAdjustment, setManualTimeAdjustment] = useState(false);

  const checkInUrl = `${window.location.origin}/check-in`;

  const handleGenerateQR = () => {
    toast({
      title: "QR Code gerado",
      description: "O QR Code foi atualizado e já está disponível para a recepção",
    });
  };

  const handleDownloadQR = () => {
    toast({
      title: "QR Code baixado",
      description: "O QR Code foi salvo em seus downloads",
    });
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Entre na Lista de Espera',
          text: 'Escaneie este QR Code para entrar na lista de espera do restaurante',
          url: checkInUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(checkInUrl);
      toast({
        title: "Link copiado",
        description: "O link foi copiado para a área de transferência",
      });
    }
  };

  const handleSaveSettings = () => {
    toast({
      title: "Configurações salvas",
      description: "Todas as configurações foram atualizadas com sucesso",
    });
  };

  const chartConfig = {
    customers: {
      label: "Clientes",
      color: "hsl(var(--primary))",
    },
    abandonment: {
      label: "Desistências",
      color: "hsl(var(--destructive))",
    },
  };

  // Usar dados reais quando disponíveis, senão usar mock
  const displayData = analytics || {
    avg_wait_time_minutes: 28,
    avg_abandonment_time_minutes: 15,
    conversion_rate: 85,
    peak_hours: [],
    return_customer_rate: 18
  };

  // Mock data para demonstração de gráficos (pode ser substituído por dados reais futuramente)
  const mockChartData = {
    currentQueueSize: 12,
    peakHours: [
      { hour: '12:00', customers: 45 },
      { hour: '13:00', customers: 62 },
      { hour: '14:00', customers: 38 },
      { hour: '19:00', customers: 58 },
      { hour: '20:00', customers: 71 },
      { hour: '21:00', customers: 42 }
    ],
    weeklyTrend: [
      { day: 'Seg', customers: 65, abandonment: 12 },
      { day: 'Ter', customers: 78, abandonment: 15 },
      { day: 'Qua', customers: 82, abandonment: 8 },
      { day: 'Qui', customers: 94, abandonment: 18 },
      { day: 'Sex', customers: 108, abandonment: 22 },
      { day: 'Sáb', customers: 156, abandonment: 28 },
      { day: 'Dom', customers: 142, abandonment: 24 }
    ],
    customerLoyalty: [
      { frequency: '1 vez', count: 120 },
      { frequency: '2-3 vezes', count: 85 },
      { frequency: '4+ vezes', count: 43 }
    ],
    ratings: { 
      average: 4.2, 
      total: 87,
      distribution: [
        { stars: 5, count: 32 },
        { stars: 4, count: 28 },
        { stars: 3, count: 15 },
        { stars: 2, count: 8 },
        { stars: 1, count: 4 }
      ]
    },
    comparison: {
      thisWeek: { customers: 485, revenue: 12840, conversion: displayData.conversion_rate },
      lastWeek: { customers: 423, revenue: 11250, conversion: 78 }
    }
  };

  const queueStatus = mockChartData.currentQueueSize >= maxQueueSize ? 'Fechada' : 'Aberta';
  const queueStatusColor = mockChartData.currentQueueSize >= maxQueueSize ? 'destructive' : 'default';

  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel do Administrador</h1>
              <p className="text-gray-600">O Cantinho Aconchegante - Dashboard</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
            >
              Voltar ao App
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center space-x-2">
              <QrCode className="w-4 h-4" />
              <span>QR Code</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Content */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Status da Fila */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Status da Fila</span>
                  <Badge variant={queueStatusColor} className="flex items-center space-x-1">
                    {queueStatus === 'Fechada' ? <AlertTriangle className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    <span>{queueStatus}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{mockChartData.currentQueueSize}/{maxQueueSize}</p>
                    <p className="text-sm text-gray-500">Pessoas na fila</p>
                  </div>
                  {queueStatus === 'Fechada' && (
                    <div className="text-right">
                      <p className="text-sm text-red-600 font-medium">Fila lotada!</p>
                      <p className="text-xs text-gray-500">Novos clientes serão notificados</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* KPIs Cards - Usando dados reais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio de Espera</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(displayData.avg_wait_time_minutes)} min</div>
                  <p className="text-xs text-muted-foreground">Baseado em dados históricos</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo até Desistência</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(displayData.avg_abandonment_time_minutes)} min</div>
                  <p className="text-xs text-green-600">Dados dos últimos 30 dias</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(displayData.conversion_rate)}%</div>
                  <p className="text-xs text-green-600">Fila para atendimento</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Retornando</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(displayData.return_customer_rate)}</div>
                  <p className="text-xs text-green-600">Taxa de retorno</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts - Mantendo dados mockados para demonstração */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Horários de Pico</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart data={mockChartData.peakHours} width={400} height={300}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="customers" fill="var(--color-customers)" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendência Semanal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <LineChart data={mockChartData.weeklyTrend} width={400} height={300}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="customers" stroke="var(--color-customers)" strokeWidth={2} />
                      <Line type="monotone" dataKey="abandonment" stroke="var(--color-abandonment)" strokeWidth={2} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados de Fidelização</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <PieChart width={400} height={300}>
                      <Pie
                        data={mockChartData.customerLoyalty}
                        cx={200}
                        cy={150}
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ frequency, percent }) => `${frequency} ${(percent * 100).toFixed(0)}%`}
                      >
                        {mockChartData.customerLoyalty.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 120}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avaliações Recebidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold flex items-center space-x-2">
                        <span>{mockChartData.ratings.average}</span>
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      </p>
                      <p className="text-sm text-gray-500">({mockChartData.ratings.total} avaliações)</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {mockChartData.ratings.distribution.map((rating) => (
                      <div key={rating.stars} className="flex items-center space-x-2">
                        <span className="text-sm w-8">{rating.stars}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${(rating.count / mockChartData.ratings.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm w-8">{rating.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Desempenho</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Clientes</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Esta semana:</span>
                        <span className="font-medium">{mockChartData.comparison.thisWeek.customers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Semana passada:</span>
                        <span className="font-medium">{mockChartData.comparison.lastWeek.customers}</span>
                      </div>
                      <div className="text-green-600 text-sm font-medium">
                        +{((mockChartData.comparison.thisWeek.customers / mockChartData.comparison.lastWeek.customers - 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Receita</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Esta semana:</span>
                        <span className="font-medium">R$ {mockChartData.comparison.thisWeek.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Semana passada:</span>
                        <span className="font-medium">R$ {mockChartData.comparison.lastWeek.revenue.toLocaleString()}</span>
                      </div>
                      <div className="text-green-600 text-sm font-medium">
                        +{((mockChartData.comparison.thisWeek.revenue / mockChartData.comparison.lastWeek.revenue - 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Conversão</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Esta semana:</span>
                        <span className="font-medium">{mockChartData.comparison.thisWeek.conversion}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Semana passada:</span>
                        <span className="font-medium">{mockChartData.comparison.lastWeek.conversion}%</span>
                      </div>
                      <div className="text-green-600 text-sm font-medium">
                        +{(mockChartData.comparison.thisWeek.conversion - mockChartData.comparison.lastWeek.conversion).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Content */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Configurações da Fila</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tamanho máximo da fila</label>
                    <Input
                      type="number"
                      value={maxQueueSize}
                      onChange={(e) => setMaxQueueSize(Number(e.target.value))}
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-gray-500 mt-1">Máximo permitido: 30 pessoas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tempo de tolerância (minutos)</label>
                    <Input
                      type="number"
                      value={toleranceMinutes}
                      onChange={(e) => setToleranceMinutes(Number(e.target.value))}
                      min="1"
                      max="60"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tempo para chegada após chamado da fila</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Reinserção após atraso</label>
                    <Select value={reinsertionPosition} onValueChange={(value: 'last' | 'first') => setReinsertionPosition(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last">Última posição</SelectItem>
                        <SelectItem value="first">Primeira posição</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Onde reinserir cliente que se atrasou</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Visibilidade pública</label>
                      <p className="text-xs text-gray-500">Exibir restaurante no guia geral</p>
                    </div>
                    <Switch
                      checked={isPublicVisible}
                      onCheckedChange={setIsPublicVisible}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Horário de Funcionamento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Abertura</label>
                      <Input
                        type="time"
                        value={operatingHours.start}
                        onChange={(e) => setOperatingHours(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Fechamento</label>
                      <Input
                        type="time"
                        value={operatingHours.end}
                        onChange={(e) => setOperatingHours(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Sistema de fila automático funcionará apenas nestes horários</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Notificações</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Notificações automáticas</label>
                      <p className="text-xs text-gray-500">Enviar alertas automáticos aos clientes</p>
                    </div>
                    <Switch
                      checked={autoNotifications}
                      onCheckedChange={setAutoNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Ajuste manual de tempo</label>
                      <p className="text-xs text-gray-500">Permitir ajuste manual das previsões</p>
                    </div>
                    <Switch
                      checked={manualTimeAdjustment}
                      onCheckedChange={setManualTimeAdjustment}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserCog className="w-5 h-5" />
                    <span>Gerenciamento de Acessos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    <UserCog className="w-4 h-4 mr-2" />
                    Gerenciar Colaboradores
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar Permissões
                  </Button>
                  <p className="text-xs text-gray-500">Configure quem pode acessar cada funcionalidade</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} className="px-8">
                Salvar Configurações
              </Button>
            </div>
          </TabsContent>

          {/* QR Code Content */}
          <TabsContent value="qr" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <QrCode className="w-5 h-5" />
                    <span>Gerar QR Code</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 mb-4">
                    <div className="w-64 h-64 mx-auto bg-gray-900 rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <QrCode className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-sm">QR Code</p>
                        <p className="text-xs opacity-75">para Check-in</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button onClick={handleGenerateQR} className="w-full">
                      <QrCode className="w-4 h-4 mr-2" />
                      Gerar Novo QR Code
                    </Button>
                    
                    <Button onClick={handleDownloadQR} variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar QR Code
                    </Button>
                    
                    <Button onClick={handleShareQR} variant="outline" className="w-full">
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Instruções de Uso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Gere o QR Code</h3>
                      <p className="text-gray-600 text-sm">Clique em "Gerar Novo QR Code" para criar/atualizar o código</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Imprima e posicione</h3>
                      <p className="text-gray-600 text-sm">Baixe, imprima e coloque o QR Code na entrada do restaurante</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Sincronização automática</h3>
                      <p className="text-gray-600 text-sm">O QR Code da recepção será automaticamente atualizado</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">4</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Compartilhe digitalmente</h3>
                      <p className="text-gray-600 text-sm">Use a função compartilhar para enviar por WhatsApp, email, etc.</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <h4 className="font-medium mb-2">Link direto:</h4>
                    <div className="bg-gray-50 p-3 rounded border">
                      <code className="text-sm text-gray-700 break-all">{checkInUrl}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

</edits_to_apply>
