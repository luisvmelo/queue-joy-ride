
import { Button } from "@/components/ui/button";
import { Clock, Users, QrCode, UserPlus } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
}

interface NavigationTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: Tab[];
}

const NavigationTabs = ({ activeTab, setActiveTab, tabs }: NavigationTabsProps) => {
  const getIcon = (tabId: string) => {
    switch (tabId) {
      case 'status':
        return Clock;
      case 'queue':
        return Users;
      case 'qr':
        return QrCode;
      case 'manual':
        return UserPlus;
      default:
        return Users;
    }
  };

  return (
    <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border mb-6">
      {tabs.map((tab) => {
        const IconComponent = tab.icon || getIcon(tab.id);
        return (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1"
          >
            <IconComponent className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
};

export default NavigationTabs;
