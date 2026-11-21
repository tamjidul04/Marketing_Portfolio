import { Suspense } from 'react';
import Link from 'next/link';
import { AdminHeader, AdminHeaderFallback } from '@/components/admin-header';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Dashboard — Admin' };

export default function DashboardPage({ searchParams }: PageProps<'/'>) {
  return (
    <>
      <Suspense fallback={<AdminHeaderFallback />}>
        <AdminHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Suspense fallback={<p className="text-[color:var(--muted)]">Loading…</p>}>
          <Dashboard searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<'/'>['searchParams'] }) {
  const admin = await requireAdmin();
  const { notice } = await searchParams;
  return (
    <div className="grid gap-6">
      {notice === 'password-updated' && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Your password was updated.
        </div>
      )}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-[color:var(--muted)]">Signed in as {admin.email}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/settings/password" className="rounded-2xl border border-line bg-card p-6 transition hover:border-gold">
          <h2 className="text-lg font-extrabold">Change password</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Update the password you use to sign in.</p>
        </Link>
        <div className="rounded-2xl border border-dashed border-line p-6">
          <h2 className="text-lg font-extrabold">Content editors</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Hero, results, case studies, services and inbox arrive in Phase 3.</p>
        </div>
      </div>
    </div>
  );
}
