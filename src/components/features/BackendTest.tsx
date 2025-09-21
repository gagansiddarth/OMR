import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { backendApiService } from '@/services/backendApi';

const BackendTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testBackendConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing backend connection...');
    
    try {
      // Test health check
      const health = await backendApiService.healthCheck();
      setTestResult(`Health check: ${JSON.stringify(health, null, 2)}`);
      
      // Test OMR processing with a simple image
      // Create a simple test image programmatically
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 300, 400);
      
      // Draw some circles (bubbles)
      ctx.fillStyle = 'black';
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 5; col++) {
          const x = 50 + col * 50;
          const y = 100 + row * 100;
          ctx.beginPath();
          ctx.arc(x, y, 15, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      
      // Fill some bubbles
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(100, 100, 12, 0, 2 * Math.PI);
      ctx.fill();
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'test_omr.png', { type: 'image/png' });
      
      const result = await backendApiService.processOMRSheet(file, 'moderate', 'test123');
      setTestResult(`OMR Processing: ${JSON.stringify(result, null, 2)}`);
      
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backend API Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={testBackendConnection} 
          disabled={isLoading}
          className="mb-4"
        >
          {isLoading ? 'Testing...' : 'Test Backend API'}
        </Button>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
          {testResult}
        </pre>
      </CardContent>
    </Card>
  );
};

export default BackendTest;
