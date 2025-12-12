import { Metadata } from 'next';
import { ResetPasswordPage } from '@/components/pages/reset-password-page';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your Freedom Aviation account.',
};

export default function ResetPassword() {
  return <ResetPasswordPage />;
}







