import { Suspense } from 'react';
import { AuthShell } from '@/components/ui';
import { ForgotPasswordForm } from '@/components/auth-forms';

export const metadata = { title: 'Reset password — Admin' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your admin email and we'll send you a link to set a new one.">
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
