import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Database } from 'lucide-react';
import { supabaseService } from '@/services/supabaseService';

export const SupabaseConnectionTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('unknown');
    setErrorMessage('');

    try {
      // Test basic connection by trying to fetch tests
      const tests = await supabaseService.getTests();
      console.log('Connection test successful, found tests:', tests);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (isTesting) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (connectionStatus === 'connected') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (connectionStatus === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    return <Database className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = () => {
    if (connectionStatus === 'connected') return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    if (connectionStatus === 'error') return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="secondary">Not Tested</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Supabase Connection Test
        </CardTitle>
        <CardDescription>
          Test your Supabase database connection and verify data storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection Status:</span>
          {getStatusBadge()}
        </div>

        {connectionStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">Connection Failed</p>
            <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 font-medium">Connection Successful!</p>
            <p className="text-sm text-green-600 mt-1">Your Supabase database is properly configured and accessible.</p>
          </div>
        )}

        <Button 
          onClick={testConnection} 
          disabled={isTesting}
          className="w-full"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Test Connection
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>This will test:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Environment variables loading</li>
            <li>Supabase client initialization</li>
            <li>Database connectivity</li>
            <li>Table access permissions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
