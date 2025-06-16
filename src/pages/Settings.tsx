import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Building, Clock, Eye, Calendar, QrCode, Bell, Palette, CreditCard, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RestaurantSettings from "@/components/settings/RestaurantSettings";
import QueueSettings from "@/components/settings/QueueSettings";
import VisibilitySettings from "@/components/settings/VisibilitySettings";
import EventsSettings from "@/components/settings/EventsSettings";
import QRCodeSettings from "@/components/settings/QRCodeSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import BrandingSettings from "@/components/settings/BrandingSettings";
import BillingSettings from "@/components/settings/BillingSettings";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import AccessDenied from "@/components/dashboard/AccessDenied";

const Settings = () => {
  const { loading, user, restaurantId } = useDashboardAuth();
  const [activeTab, setActiveTab] = useState("restaurant");
  const navigate = useNavigate();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!restaurantId || !user) {
    return <AccessDenied />;
  }

  const settingsTabs = [
    { id: "restaurant", label: "Restaurante", icon: Building, component: RestaurantSettings },
    { id: "queue", label: "Fila & Atendimento", icon: Clock, component: QueueSettings },
    { id: "visibility", label: "Visibilidade", icon: Eye, component: VisibilitySettings },
    { id: "events", label: "Eventos", icon: Calendar, component: EventsSettings },
    { id: "qrcode", label: "QR Code", icon: QrCode, component: QRCodeSettings },
    { id: "notifications", label: "Notificações", icon: Bell, component: NotificationSettings },
    { id: "branding", label: "Branding", icon: Palette, component: BrandingSettings },
    { id: "billing", label: "Faturamento", icon: CreditCard, component: BillingSettings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">Gerencie todas as configurações do seu restaurante</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex gap-6">
          <TabsList className="flex flex-col h-fit w-64 bg-white p-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="w-full justify-start gap-3 p-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex-1">
            {settingsTabs.map((tab) => {
              const Component = tab.component;
              return (
                <TabsContent key={tab.id} value={tab.id} className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Component restaurantId={restaurantId} />
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
