import { AuthShell } from '@/components/ui';
import { signOut } from '@/lib/actions/auth';

export const metadata = { title: 'No access — Admin' };

export default function NotAuthorizedPage() {
  return (
    <AuthShell title="No admin access" subtitle="You're signed in, but this account isn't allowed to manage the portfolio.">
      <form action={signOut}>
        <button className="min-h-12 w-full rounded-xl bg-navy px-5 font-bold text-white">Sign out</button>
      </form>
    </AuthShell>
  );
}
