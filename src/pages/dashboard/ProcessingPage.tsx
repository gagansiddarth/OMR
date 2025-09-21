import React from 'react';
import { 
  Clock, CheckCircle, AlertTriangle, RefreshCw, Eye, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProcessingItem } from '@/types';

interface ProcessingPageProps {
  uploads: ProcessingItem[];
  onViewResult: (upload: ProcessingItem) => void;
  onRetry: (upload: ProcessingItem) => void;
  onCancel: (upload: ProcessingItem) => void;
  onRemove: (upload: ProcessingItem) => void;
}

const ProcessingPage: React.FC<ProcessingPageProps> = ({ 
  uploads, 
  onViewResult, 
  onRetry, 
  onCancel, 
  onRemove 
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Processing Queue</h2>
        <p className="text-muted-foreground">Monitor active OMR processing tasks</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-bold">
                  {uploads.filter(u => u.status === 'processing').length}
                </p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold">
                  {uploads.filter(u => u.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">
                  {uploads.filter(u => u.status === 'failed').length}
                </p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Processing</CardTitle>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No processing tasks</p>
              <p className="text-sm">Upload OMR sheets to see processing status here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploads.map((upload) => {
                const getStatusIcon = () => {
                  switch (upload.status) {
                    case 'processing':
                      return <Clock className="h-4 w-4 text-warning" />;
                    case 'completed':
                      return <CheckCircle className="h-4 w-4 text-success" />;
                    case 'failed':
                      return <AlertTriangle className="h-4 w-4 text-destructive" />;
                    default:
                      return <Clock className="h-4 w-4 text-muted-foreground" />;
                  }
                };

                const getStatusColor = () => {
                  switch (upload.status) {
                    case 'processing':
                      return 'border-warning/20 bg-warning/5';
                    case 'completed':
                      return 'border-success/20 bg-success/5';
                    case 'failed':
                      return 'border-destructive/20 bg-destructive/5';
                    default:
                      return 'border-muted';
                  }
                };

                const formatFileSize = (bytes: number) => {
                  if (bytes === 0) return '0 Bytes';
                  const k = 1024;
                  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                  const i = Math.floor(Math.log(bytes) / Math.log(k));
                  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                };

                const getElapsedTime = () => {
                  if (!upload.startTime) return 'Unknown';
                  const elapsed = Date.now() - upload.startTime;
                  const seconds = Math.floor(elapsed / 1000);
                  const minutes = Math.floor(seconds / 60);
                  
                  if (minutes > 0) {
                    return `${minutes}m ${seconds % 60}s`;
                  }
                  return `${seconds}s`;
                };

                return (
                  <div 
                    key={upload.id} 
                    className={`flex items-center gap-4 p-4 border rounded-lg ${getStatusColor()}`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon()}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{upload.filename}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {upload.status === 'processing' ? `Elapsed: ${getElapsedTime()}` : 
                             upload.endTime ? `Completed in ${getElapsedTime()}` : ''}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {upload.evaluationMode}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={upload.progress} className="mb-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>ID: {upload.id}</span>
                        <span>{formatFileSize(upload.size)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {upload.status === 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onViewResult(upload)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                      {upload.status === 'failed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onRetry(upload)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      )}
                      {upload.status === 'processing' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onCancel(upload)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onRemove(upload)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingPage;
