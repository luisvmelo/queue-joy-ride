
import { Button } from "@/components/ui/button";
import { Clock, Users, QrCode } from "lucide-react";

interface NavigationTabsProps {
  activeTab: 'qr' | 'queue' | 'status';
  setActiveTab: (tab: 'qr' | 'queue' | 'status') => void;
}

const NavigationTabs = ({ activeTab, setActiveTab }: NavigationTabsProps) => {
  return (
    <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border mb-6">
      <Button
        variant={activeTab === 'status' ? 'default' : 'ghost'}
        onClick={() => setActiveTab('status')}
        className="flex-1"
      >
        <Clock className="w-4 h-4 mr-2" />
        Status da Fila
      </Button>
      <Button
        variant={activeTab === 'queue' ? 'default' : 'ghost'}
        onClick={() => setActiveTab('queue')}
        className="flex-1"
      >
        <Users className="w-4 h-4 mr-2" />
        Fila Completa
      </Button>
      <Button
        variant={activeTab === 'qr' ? 'default' : 'ghost'}
        onClick={() => setActiveTab('qr')}
        className="flex-1"
      >
        <QrCode className="w-4 h-4 mr-2" />
        QR Code
      </Button>
    </div>
  );
};

export default NavigationTabs;
