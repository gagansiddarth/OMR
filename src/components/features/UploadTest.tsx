import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface UploadTestProps {
  onTestUpload: () => void;
  isTesting: boolean;
  testResult?: 'success' | 'error';
  testMessage?: string;
}

export const UploadTest: React.FC<UploadTestProps> = ({ 
  onTestUpload, 
  isTesting, 
  testResult, 
  testMessage 
}) => {
  const getStatusIcon = () => {
    if (isTesting) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (testResult === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (testResult === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    return <TestTube className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = () => {
    if (testResult === 'success') return <Badge variant="default" className="bg-green-500">Success</Badge>;
    if (testResult === 'error') return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="secondary">Ready</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Upload Flow Test
        </CardTitle>
        <CardDescription>
          Test the complete upload and processing workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Test Status:</span>
          {getStatusBadge()}
        </div>

        {testResult === 'error' && testMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">Test Failed</p>
            <p className="text-sm text-red-600 mt-1">{testMessage}</p>
          </div>
        )}

        {testResult === 'success' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 font-medium">Test Successful!</p>
            <p className="text-sm text-green-600 mt-1">Upload workflow is working correctly.</p>
          </div>
        )}

        <Button 
          onClick={onTestUpload} 
          disabled={isTesting}
          className="w-full"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing Upload Flow...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Test Upload Flow
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>This will test:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>File upload handling</li>
            <li>Student identification dialog</li>
            <li>OMR processing (mock or real)</li>
            <li>Database storage</li>
            <li>Results display</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
