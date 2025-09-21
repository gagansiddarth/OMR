import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const EnvTest: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Environment Variables Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">VITE_SUPABASE_URL:</span>
            <Badge variant={supabaseUrl ? 'default' : 'destructive'}>
              {supabaseUrl ? 'Set' : 'Missing'}
            </Badge>
          </div>
          <div className="p-2 bg-gray-100 rounded text-sm font-mono">
            {supabaseUrl || 'Not found'}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">VITE_SUPABASE_ANON_KEY:</span>
            <Badge variant={supabaseKey ? 'default' : 'destructive'}>
              {supabaseKey ? 'Set' : 'Missing'}
            </Badge>
          </div>
          <div className="p-2 bg-gray-100 rounded text-sm font-mono">
            {supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Not found'}
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-600">
            <strong>Note:</strong> If either variable shows "Missing", check your .env.local file and restart the dev server.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvTest;
