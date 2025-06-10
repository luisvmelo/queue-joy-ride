
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  Target
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";

// Mock data para demonstração
const mockAnalytics = {
  averageWaitTime: 28,
  abandonmentRate: 15,
  menuViewRate: 72,
  peakHours: [
    { hour: '12:00', customers: 45 },
    { hour: '13:00', customers: 62 },
    { hour: '14:00', customers: 38 },
    { hour: '19:00', customers: 58 },
    { hour: '20:00', customers: 71 },
    { hour: '21:00', customers: 42 }
  ],
  conversionRate: 85,
  returningCustomers: 32,
  customerLoyalty: [
    { frequency: '1 vez', count: 120 },
    { frequency: '2-3 vezes', count: 85 },
    { frequency: '4+ vezes', count: 43 }
  ],
  menuItems: [
    { item: 'Pizza Margherita', views: 156, avgTime: '2:30' },
    { item: 'Hambúrguer Clássico', views: 134, avgTime: '1:45' },
    { item: 'Lasanha', views: 98, avgTime: '3:15' }
  ],
  ratings: { average: 4.2, total: 87 },
  comparison: {
    thisWeek: { customers: 485, revenue: 12840 },
    lastWeek: { customers: 423, revenue: 11250 }
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'qr'>('dashboard');
  
  // Configurações do restaurante
  const [maxQueueSize, setMaxQueueSize] = useState(50);
  const [toleranceMinutes, setToleranceMinutes] = useState(10);
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
  };

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
            {/* KPIs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio de Espera</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.averageWaitTime} min</div>
                  <p className="text-xs text-muted-foreground">+2 min vs. semana passada</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Abandono</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.abandonmentRate}%</div>
                  <p className="text-xs text-green-600">-3% vs. semana passada</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.conversionRate}%</div>
                  <p className="text-xs text-green-600">+5% vs. semana passada</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Retornando</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.returningCustomers}%</div>
                  <p className="text-xs text-green-600">+8% vs. semana passada</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Horários de Pico</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart data={mockAnalytics.peakHours} width={400} height={300}>
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
                  <CardTitle>Fidelização dos Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <PieChart width={400} height={300}>
                      <Pie
                        data={mockAnalytics.customerLoyalty}
                        cx={200}
                        cy={150}
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ frequency, percent }) => `${frequency} ${(percent * 100).toFixed(0)}%`}
                      >
                        {mockAnalytics.customerLoyalty.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 120}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Itens Mais Visualizados no Cardápio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAnalytics.menuItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.item}</p>
                          <p className="text-sm text-gray-500">{item.views} visualizações</p>
                        </div>
                        <Badge variant="outline">{item.avgTime}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avaliações e Comparação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Avaliação Média</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{mockAnalytics.ratings.average}</span>
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm text-gray-500">({mockAnalytics.ratings.total} avaliações)</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Comparação Semanal</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Esta semana:</span>
                        <span className="font-medium">{mockAnalytics.comparison.thisWeek.customers} clientes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Semana passada:</span>
                        <span className="font-medium">{mockAnalytics.comparison.lastWeek.customers} clientes</span>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-green-600 text-sm font-medium">
                          +{((mockAnalytics.comparison.thisWeek.customers / mockAnalytics.comparison.lastWeek.customers - 1) * 100).toFixed(1)}% de crescimento
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                    <label className="block text-sm font-medium mb-2">Limite máximo de pessoas na fila</label>
                    <Input
                      type="number"
                      value={maxQueueSize}
                      onChange={(e) => setMaxQueueSize(Number(e.target.value))}
                      min="1"
                      max="200"
                    />
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
