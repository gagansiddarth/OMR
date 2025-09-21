import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  Download,
  Trash2
} from 'lucide-react';

export interface ProcessingItem {
  id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  result?: any;
  error?: string;
}

interface ProcessingStatusProps {
  items: ProcessingItem[];
  onViewResult?: (item: ProcessingItem) => void;
  onRetry?: (item: ProcessingItem) => void;
  onCancel?: (item: ProcessingItem) => void;
  onRemove?: (item: ProcessingItem) => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  items,
  onViewResult,
  onRetry,
  onCancel,
  onRemove
}) => {
  const getStatusIcon = (status: ProcessingItem['status']) => {
    switch (status) {
      case 'uploading':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ProcessingItem['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ProcessingItem['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const activeItems = items.filter(item => 
    item.status === 'uploading' || item.status === 'processing'
  );
  const completedItems = items.filter(item => item.status === 'completed');
  const failedItems = items.filter(item => item.status === 'failed');

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{activeItems.length}</p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{completedItems.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{failedItems.length}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Items */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Queue</CardTitle>
            <CardDescription>
              Monitor the status of your OMR sheet processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(item.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium truncate">{item.filename}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(item.startTime, item.endTime)}
                        </span>
                      </div>
                    </div>
                    
                    {(item.status === 'uploading' || item.status === 'processing') && (
                      <Progress value={item.progress} className="h-2" />
                    )}
                    
                    {item.status === 'failed' && item.error && (
                      <p className="text-sm text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.status === 'completed' && onViewResult && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewResult(item)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    
                    {item.status === 'failed' && onRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetry(item)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                    
                    {(item.status === 'uploading' || item.status === 'processing') && onCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCancel(item)}
                      >
                        Cancel
                      </Button>
                    )}
                    
                    {onRemove && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemove(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {items.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No processing items</p>
            <p className="text-sm text-muted-foreground">
              Upload OMR sheets to start processing
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProcessingStatus;
