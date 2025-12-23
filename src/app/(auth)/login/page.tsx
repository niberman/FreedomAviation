import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginPage } from '@/components/pages/login-page';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Freedom Aviation owner portal.',
};

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}

