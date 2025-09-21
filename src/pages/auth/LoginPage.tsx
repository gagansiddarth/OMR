import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

interface LoginPageProps {
  onAuth: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onAuth }) => {
  const [authToken, setAuthToken] = useState('');

  const handleLogin = () => {
    if (authToken) {
      toast({ title: "Authenticated", description: "Token validated successfully" });
    } else {
      toast({ title: "Demo Mode", description: "Using sample data for demonstration" });
    }
    onAuth(authToken);
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            System Authentication
          </CardTitle>
          <CardDescription>
            Enter your API token or continue in demo mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="token">API Token (Optional)</Label>
            <Input
              id="token"
              type="password"
              placeholder="Enter authentication token..."
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleLogin}
              className="flex-1"
            >
              {authToken ? 'Authenticate' : 'Continue Demo'}
            </Button>
          </div>
          {!authToken && (
            <div className="text-center">
              <Badge variant="secondary">Demo Mode Active</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
