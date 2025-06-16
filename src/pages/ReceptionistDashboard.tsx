
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import CurrentQueue from "@/components/CurrentQueue";
import QueueStatus from "@/components/QueueStatus";
import ManualQueueEntry from "@/components/ManualQueueEntry";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCards from "@/components/dashboard/StatsCards";
import NavigationTabs from "@/components/dashboard/NavigationTabs";
import ReadyParties from "@/components/dashboard/ReadyParties";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import AccessDenied from "@/components/dashboard/AccessDenied";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardActions } from "@/hooks/useDashboardActions";

const ReceptionistDashboard = () => {
  const [activeTab, setActiveTab] = useState<'qr' | 'queue' | 'status'>('status');
  
  const { loading, user, restaurantId } = useDashboardAuth();
  const { queueData, restaurant, stats, fetchQueueData } = useDashboardData(restaurantId, user);
  const {
    handleCallNext,
    handleConfirmArrival,
    handleMarkNoShow,
    handleSendNotification,
    handleSendBulkNotification,
    handleSignOut
  } = useDashboardActions(restaurantId, fetchQueueData);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!restaurantId || !user) {
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
        
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Manual Queue Entry - Always visible */}
        <div className="mb-6">
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
        </div>

        {/* Content based on active tab */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            <ReadyParties
              queueData={queueData}
              onConfirmArrival={handleConfirmArrival}
              onMarkNoShow={handleMarkNoShow}
            />

            <Card>
              <CardHeader>
                <CardTitle>Próximos 5 da Fila</CardTitle>
              </CardHeader>
              <CardContent>
                <QueueStatus
                  queueData={queueData.filter(p => p.status === 'waiting').slice(0, 5)}
                  onConfirmArrival={handleConfirmArrival}
                  onMarkNoShow={handleMarkNoShow}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'queue' && (
          <CurrentQueue
            queueData={queueData}
            onConfirmArrival={handleConfirmArrival}
            onMarkNoShow={handleMarkNoShow}
            onSendNotification={handleSendNotification}
            onSendBulkNotification={handleSendBulkNotification}
          />
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
