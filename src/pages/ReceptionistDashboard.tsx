
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import ManualQueueEntry from "@/components/ManualQueueEntry";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCards from "@/components/dashboard/StatsCards";
import NavigationTabs from "@/components/dashboard/NavigationTabs";
import QueueManagement from "@/components/dashboard/QueueManagement";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import AccessDenied from "@/components/dashboard/AccessDenied";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardActions } from "@/hooks/useDashboardActions";

const ReceptionistDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>('queue');
  
  const { loading, user, restaurantId } = useDashboardAuth();
  const { queueData, restaurant, stats, fetchQueueData } = useDashboardData(restaurantId, user);
  const {
    handleCallNext,
    handleConfirmArrival,
    handleMarkNoShow,
    handleSignOut
  } = useDashboardActions(restaurantId, fetchQueueData);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!restaurantId) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        restaurantName={restaurant?.name || ''}
        totalInQueue={stats.totalInQueue}
        onCallNext={handleCallNext}
        onSignOut={handleSignOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StatsCards stats={stats} />
        
        <NavigationTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          tabs={[
            { id: 'queue', label: 'Gerenciar Fila' },
            { id: 'manual', label: 'Adicionar Cliente' },
            { id: 'qr', label: 'QR Code' }
          ]}
        />

        {/* Content based on active tab */}
        {activeTab === 'queue' && (
          <QueueManagement
            queueData={queueData}
            onCallNext={handleCallNext}
            onConfirmArrival={handleConfirmArrival}
            onMarkNoShow={handleMarkNoShow}
          />
        )}

        {activeTab === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Adicionar à Fila Manualmente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ManualQueueEntry 
                restaurantId={restaurantId}
                onPartyAdded={fetchQueueData}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'qr' && restaurantId && (
          <QRCodeGenerator 
            restaurantId={restaurantId} 
            restaurantName={restaurant?.name || 'Restaurante'}
          />
        )}
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
