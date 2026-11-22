import { Suspense } from 'react';
import { AuthShell } from '@/components/ui';
import { NewPasswordForm } from '@/components/auth-forms';
import Link from 'next/link';
import { cameFromResetLink, requireAdmin } from '@/lib/auth';

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
  if (!(await cameFromResetLink())) {
    return (
      <div className="grid gap-3 text-sm">
        <p>This page only works right after opening a password-reset link from your email (links expire after 1 hour).</p>
        <p>
          <Link href="/forgot-password" className="font-bold underline">Request a new reset link</Link>, or change your password in{' '}
          <Link href="/settings/password" className="font-bold underline">Settings → Password</Link>.
        </p>
      </div>
    );
  }
  return (
    <>
      <p className="mb-4 text-sm text-[color:var(--muted)]">For <b className="text-foreground">{admin.email}</b></p>
      <NewPasswordForm />
    </>
  );
}
