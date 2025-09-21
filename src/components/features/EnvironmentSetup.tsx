import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, ExternalLink } from 'lucide-react';

export const EnvironmentSetup: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL
VITE_API_URL=http://localhost:8000`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(envContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Environment Setup Required
        </CardTitle>
        <CardDescription>
          To use Supabase database, you need to configure environment variables.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Currently using local storage. Configure Supabase for persistent data storage.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Step 1: Get Supabase Credentials</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Go to your Supabase dashboard and copy your project credentials.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://app.supabase.com', '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Supabase Dashboard
            </Button>
          </div>

          <div>
            <Label className="text-sm font-medium">Step 2: Create .env.local file</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Create a file named <code>.env.local</code> in your project root with the following content:
            </p>
            
            <div className="relative">
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                {envContent}
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="absolute top-2 right-2 gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Step 3: Update Credentials</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Replace the placeholder values with your actual Supabase credentials:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Replace <code>your-project-id</code> with your actual project ID</li>
              <li>• Replace <code>your-anon-key-here</code> with your actual anon key</li>
            </ul>
          </div>

          <div>
            <Label className="text-sm font-medium">Step 4: Restart Development Server</Label>
            <p className="text-sm text-muted-foreground">
              After creating the file, restart your development server:
            </p>
            <code className="block bg-muted p-2 rounded mt-1 text-sm">
              npm run dev
            </code>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Note:</strong> The app will continue to work with local storage if Supabase is not configured.
            This is just for persistent data storage across sessions.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
