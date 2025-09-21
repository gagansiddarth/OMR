import React from 'react';
import { 
  Target, BookOpen, Settings, Upload, Clock, 
  BarChart3, Plus, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NAVIGATION_ITEMS } from '@/constants';
import { TabId } from '@/types';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onShowSettings: () => void;
}

const iconMap = {
  Plus,
  Upload,
  Clock,
  BarChart3,
  FileText
};

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange,
  onShowSettings
}) => {
  return (
    <div className="w-64 bg-card border-r">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">OMR System</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onShowSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <nav className="space-y-2">
          {NAVIGATION_ITEMS.map((item) => {
            const IconComponent = iconMap[item.icon as keyof typeof iconMap];
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onTabChange(item.id as TabId)}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </nav>

      </div>
    </div>
  );
};

export default Sidebar;
