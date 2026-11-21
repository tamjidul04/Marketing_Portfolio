import { Suspense } from 'react';
import Link from 'next/link';
import { AdminHeader, AdminHeaderFallback } from '@/components/admin-header';
import { ChangePasswordForm } from '@/components/auth-forms';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Change password — Admin' };

export default function ChangePasswordPage() {
  return (
    <>
      <Suspense fallback={<AdminHeaderFallback />}>
        <AdminHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <Link href="/" className="text-sm font-bold text-[color:var(--muted)] hover:text-foreground">← Dashboard</Link>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Change password</h1>
        <p className="mt-1 text-[color:var(--muted)]">You&apos;ll need your current password.</p>
        <div className="mt-6 rounded-2xl border border-line bg-card p-6 sm:p-8">
          <Suspense fallback={<p className="text-sm text-[color:var(--muted)]">Loading…</p>}>
            <Gate />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function Gate() {
  await requireAdmin();
  return <ChangePasswordForm />;
}
