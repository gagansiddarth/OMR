import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DatabaseService } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      setErrorMessage('');
      
      console.log('Testing Supabase connection...');
      console.log('Environment variables:', {
        url: import.meta.env.VITE_SUPABASE_URL,
        key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
      });
      
      // Test basic connection first
      const { supabase } = await import('@/lib/supabase');
      console.log('Supabase client created:', supabase);
      
      // Test a simple query to check connection
      const { data, error } = await supabase.from('students').select('count').limit(1);
      
      if (error) {
        console.log('Database query error (expected if tables not created):', error);
        // If tables don't exist, that's okay - we just want to test the connection
        if (error.code === 'PGRST116' || error.message.includes('relation "students" does not exist')) {
          console.log('Tables not created yet, but connection works');
          setConnectionStatus('connected');
          setTestResults([]);
          return;
        }
        throw error;
      }
      
      console.log('Students fetched:', data);
      setConnectionStatus('connected');
      setTestResults(data || []);
    } catch (error) {
      console.error('Supabase connection error:', error);
      setConnectionStatus('error');
      
      let errorMsg = 'Unknown error';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMsg = JSON.stringify(error, null, 2);
      }
      
      setErrorMessage(errorMsg);
    }
  };

  const testCreateStudent = async () => {
    try {
      const testStudent = {
        student_id: `TEST_${Date.now()}`,
        name: 'Test Student',
        class: 'Test Class'
      };
      
      const result = await DatabaseService.createStudent(testStudent);
      setTestResults(prev => [result, ...prev]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create student');
    }
  };

  const testFileUpload = async () => {
    try {
      // Create a test file
      const testFile = new File(['test content'], 'test-omr.jpg', { type: 'image/jpeg' });
      
      const filePath = `test-uploads/test-${Date.now()}.jpg`;
      const result = await DatabaseService.uploadFile(testFile, filePath);
      
      console.log('File upload result:', result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload file');
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Supabase Connection Test</span>
          {connectionStatus === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
          {connectionStatus === 'connected' && <CheckCircle className="h-4 w-4 text-green-600" />}
          {connectionStatus === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
            {connectionStatus === 'testing' && 'Testing...'}
            {connectionStatus === 'connected' && 'Connected'}
            {connectionStatus === 'error' && 'Error'}
          </Badge>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">✅ Supabase connection successful!</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Test Actions:</h4>
              <div className="flex gap-2">
                <Button onClick={testCreateStudent} size="sm">
                  Test Create Student
                </Button>
                <Button onClick={testFileUpload} size="sm" variant="outline">
                  Test File Upload
                </Button>
                <Button onClick={testConnection} size="sm" variant="outline">
                  Refresh Data
                </Button>
              </div>
            </div>

            {testResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Database Results:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {testResults.map((item, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{item.name || item.filename || 'Unknown'}</div>
                      <div className="text-gray-500">
                        ID: {item.student_id || item.id} | 
                        Class: {item.class || 'N/A'} |
                        Created: {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Please check your Supabase configuration:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Verify your .env.local file has correct VITE_SUPABASE_URL</li>
              <li>• Verify your .env.local file has correct VITE_SUPABASE_ANON_KEY</li>
              <li>• Make sure you've run the SQL schema in Supabase</li>
              <li>• Check that your Supabase project is active</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseTest;
