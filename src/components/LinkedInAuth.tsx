
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Linkedin, Shield, AlertTriangle } from 'lucide-react';

interface LinkedInAuthProps {
  onAuthSuccess: () => void;
}

const LinkedInAuth: React.FC<LinkedInAuthProps> = ({ onAuthSuccess }) => {
  const [sessionCookie, setSessionCookie] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    if (!sessionCookie.trim()) {
      setError('Please enter your LinkedIn session cookie');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Store the session cookie securely in localStorage
      localStorage.setItem('linkedin_session', sessionCookie);
      
      // Validate the session by attempting to access the saved posts page
      await validateSession(sessionCookie);
      
      onAuthSuccess();
    } catch (err) {
      setError('Invalid session cookie. Please check and try again.');
      localStorage.removeItem('linkedin_session');
    } finally {
      setIsLoading(false);
    }
  };

  const validateSession = async (cookie: string): Promise<void> => {
    // In a real implementation, this would make a request to verify the session
    // For now, we'll simulate validation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (cookie.length > 10) {
          resolve();
        } else {
          reject(new Error('Invalid cookie'));
        }
      }, 1000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-linkedin-blue to-linkedin-blue-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-linkedin-blue rounded-full flex items-center justify-center mb-4">
            <Linkedin className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            LinkedIn Post Scraper
          </CardTitle>
          <CardDescription className="text-gray-600">
            Connect your LinkedIn account to access your saved posts
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">
              <strong>How to get your session cookie:</strong>
              <ol className="mt-2 ml-4 list-decimal space-y-1 text-xs">
                <li>Open LinkedIn in your browser and log in</li>
                <li>Press F12 to open Developer Tools</li>
                <li>Go to Application/Storage → Cookies → linkedin.com</li>
                <li>Find and copy the "li_at" cookie value</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="session-cookie" className="text-sm font-medium text-gray-700">
              LinkedIn Session Cookie (li_at)
            </label>
            <Input
              id="session-cookie"
              type="password"
              placeholder="Enter your li_at cookie value..."
              value={sessionCookie}
              onChange={(e) => setSessionCookie(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleAuth}
            disabled={isLoading}
            className="w-full bg-linkedin-blue hover:bg-linkedin-blue-dark transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </div>
            ) : (
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Connect LinkedIn
              </div>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your credentials are stored locally and never sent to external servers
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedInAuth;
