import { Suspense } from 'react';
import { ChangePasswordForm } from '@/components/auth-forms';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Change password — Admin' };

export default function ChangePasswordPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Change password</h1>
      <p className="mt-1 text-muted">You&apos;ll need your current password.</p>
      <div className="mt-6 rounded-2xl border border-line bg-card p-5 sm:p-8">
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <Gate />
        </Suspense>
      </div>
    </div>
  );
}

async function Gate() {
  await requireAdmin();
  return <ChangePasswordForm />;
}
