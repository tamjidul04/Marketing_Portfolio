import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { signOut } from '@/lib/actions/auth';

export async function AdminHeader() {
  const admin = await requireAdmin();
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold">
          <span className="grid size-9 place-items-center rounded-lg bg-navy text-sm text-gold">A</span>
          <span className="hidden sm:inline">Portfolio Admin</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-bold sm:gap-3">
          <Link href="/settings/password" className="rounded-lg px-3 py-2 hover:bg-line/60">Password</Link>
          <span className="hidden max-w-48 truncate text-[color:var(--muted)] md:inline" title={admin.email}>{admin.email}</span>
          <form action={signOut}>
            <button className="rounded-lg border border-line px-3 py-2 hover:border-gold">Sign out</button>
          </form>
        </nav>
      </div>
    </header>
  );
}

export function AdminHeaderFallback() {
  return <div className="h-16 border-b border-line bg-card" aria-hidden />;
}
