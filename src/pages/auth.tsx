import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from '@tanstack/react-router';
import { Loader2, AlertTriangle, Book } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const AuthPage: React.FC = () => {
  const { user, loading, isConfigured } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Show setup instructions if Supabase is not configured
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Supabase Setup Required</CardTitle>
            <CardDescription>
              To use the authentication system, you need to configure Supabase connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-semibold mb-2">📋 What you need to do:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Create a Supabase account (free): <code>https://supabase.com</code></li>
                <li>Create a new project</li>
                <li>Get the URL and API Key</li>
                <li>Update the <code>.env</code> file with your details</li>
                <li>Restart the system</li>
              </ol>
            </div>

            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
              <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
                🔧 Current .env file:
              </h3>
              <div className="font-mono text-xs bg-background p-2 rounded border text-muted-foreground">
                SUPABASE_URL=https://your-project-id.supabase.co<br />
                SUPABASE_ANON_KEY=your-anon-key-here
              </div>
              <p className="text-sm mt-2 text-yellow-700 dark:text-yellow-300">
                Replace these values with your actual project details from Supabase
              </p>
            </div>

            <Button 
              className="w-full" 
              onClick={() => window.open('SUPABASE_SETUP.md', '_blank')}
              variant="outline"
            >
              <Book className="mr-2 h-4 w-4" />
              Open detailed setup guide
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                The complete guide is in <code>SUPABASE_SETUP.md</code> in the project folder
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Core77</h1>
          <p className="text-muted-foreground">Smart App Development System</p>
        </div>

        {/* Login Form Only */}
        <LoginForm />
      </div>
    </div>
  );
}; 