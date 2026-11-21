import { Suspense } from 'react';
import { AuthShell } from '@/components/ui';
import { NewPasswordForm } from '@/components/auth-forms';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Set new password — Admin' };

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you don't use anywhere else.">
      <Suspense fallback={<p className="text-sm text-[color:var(--muted)]">Checking your link…</p>}>
        <Gate />
      </Suspense>
    </AuthShell>
  );
}

async function Gate() {
  const admin = await requireAdmin(); // the email link signed you in
  return (
    <>
      <p className="mb-4 text-sm text-[color:var(--muted)]">For <b className="text-foreground">{admin.email}</b></p>
      <NewPasswordForm />
    </>
  );
}
