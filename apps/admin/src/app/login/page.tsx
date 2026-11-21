import { Suspense } from 'react';
import { AuthShell } from '@/components/ui';
import { LoginForm } from '@/components/auth-forms';

export const metadata = { title: 'Sign in — Admin' };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your portfolio.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
