import { Metadata } from 'next';
import { ForgotPasswordPage } from '@/components/pages/forgot-password-page';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Freedom Aviation account password.',
};

export default function ForgotPassword() {
  return <ForgotPasswordPage />;
}
