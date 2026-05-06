'use client';

import { useState } from 'react';
import { setupAdminUser } from '@/lib/setup-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSetupAdmin = async () => {
    setLoading(true);
    setMessage('');
    setSuccess(false);

    try {
      console.log('Setup button clicked, starting setup...');
      await setupAdminUser();
      setMessage('✓ Admin user created successfully! You can now login with: admin@mygotooutfit.com / password123');
      setSuccess(true);
    } catch (error: any) {
      console.error('Setup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setMessage('✓ Admin user already exists. You can login with: admin@mygotooutfit.com / password123');
        setSuccess(true);
      } else if (error.code === 'auth/invalid-email') {
        setMessage('❌ Invalid email. Please check Firebase configuration and ensure Email/Password authentication is enabled in Firebase Console.');
        setSuccess(false);
      } else if (error.code === 'auth/operation-not-allowed') {
        setMessage('❌ Email/Password authentication is not enabled. Go to Firebase Console > Authentication > Sign-in method and enable Email/Password.');
        setSuccess(false);
      } else if (error.code === 'auth/weak-password') {
        setMessage(`❌ Password is too weak. ${error.message}`);
        setSuccess(false);
      } else {
        setMessage(`❌ Error: ${error.code} - ${error.message}`);
        setSuccess(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Initial Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">First Time Setup</h3>
            <p className="text-sm text-blue-800">
              Click the button below to create the admin user. You'll then be able to login with:
            </p>
            <div className="mt-3 space-y-1 text-sm font-mono bg-white p-3 rounded border border-blue-100">
              <p>Email: <span className="text-blue-600">admin@mygotooutfit.com</span></p>
              <p>Password: <span className="text-blue-600">password123</span></p>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              success 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <Button
            onClick={handleSetupAdmin}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            {loading ? 'Setting up...' : 'Setup Admin User'}
          </Button>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-900">
            <p className="font-semibold mb-2">⚠️ Troubleshooting:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Make sure Firebase Email/Password auth is <strong>enabled</strong> in Firebase Console</li>
              <li>Check browser console (F12) for detailed error messages</li>
              <li>Ensure your Firebase project is properly configured</li>
            </ol>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This only needs to be run once. After setup, you can delete this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
