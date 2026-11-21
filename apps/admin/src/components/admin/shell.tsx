import type { ReactNode } from 'react';
import { Icon } from '@/components/admin/icons';
import { MobileBar } from '@/components/admin/mobile-drawer';
import { NavList } from '@/components/admin/nav-list';
import { requireAdmin } from '@/lib/auth';
import { signOut } from '@/lib/actions/auth';
import { SITE_URL } from '@/lib/env';
import { readableOn } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';

function Brand({ initials, name, dark = false }: { initials: string; name: string; dark?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg text-sm font-extrabold ${dark ? 'bg-accent text-on-accent' : 'bg-navy text-accent'}`}>{initials}</span>
      <span className="min-w-0 leading-tight">
        <span className={`block truncate text-[15px] font-extrabold ${dark ? 'text-white' : 'text-foreground'}`}>{name}</span>
        <span className={`block text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-white/65' : 'text-muted'}`}>Admin</span>
      </span>
    </span>
  );
}

function UserBox({ email }: { email: string }) {
  return (
    <div className="grid gap-2 border-t border-white/10 pt-4">
      <a
        href={SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 items-center gap-3 rounded-xl bg-accent px-3 text-[15px] font-bold text-on-accent transition hover:brightness-110"
      >
        <Icon name="external" size={18} />
        View live site
      </a>
      <p className="truncate px-1 text-xs text-white/70" title={email}>
        Signed in as {email}
      </p>
      <form action={signOut}>
        <button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-white/75 transition hover:bg-white/8 hover:text-white">
          <Icon name="logout" size={18} />
          Sign out
        </button>
      </form>
    </div>
  );
}

/**
 * Signed-in page frame: navy sidebar (desktop) / drawer (phone). Loads the owner's name and brand colours
 * from the database so the admin always matches the website. Must render inside <Suspense>.
 */
export async function Shell({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [{ data: profile }, { data: settings }, { count: unread }] = await Promise.all([
    supabase.from('profile').select('full_name, initials').eq('id', 1).maybeSingle(),
    supabase.from('site_settings').select('color_primary, color_accent, color_highlight').eq('id', 1).maybeSingle(),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ]);
  const badges = { '/inbox': unread ?? 0 };

  const name = profile?.full_name ?? 'Portfolio';
  const initials = profile?.initials ?? 'P';
  const accent = settings?.color_accent ?? '#10B981';
  // Colours come from the database as validated #RRGGBB values.
  const theme = `:root{--navy:${settings?.color_primary ?? '#1B2A4A'};--accent:${accent};--highlight:${settings?.color_highlight ?? accent};--on-accent:${readableOn(accent)}}`;

  return (
    <>
      <style>{theme}</style>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-navy focus:px-4 focus:py-3 focus:font-bold focus:text-white">Skip to content</a>
      <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto bg-navy p-4 pb-5 text-white lg:flex">
          <Brand initials={initials} name={name} dark />
          <NavList badges={badges} />
          <div className="mt-auto">
            <UserBox email={admin.email} />
          </div>
        </aside>

        <div className="min-w-0">
          <MobileBar brand={<Brand initials={initials} name={name} dark={false} />} footer={<UserBox email={admin.email} />} badges={badges} />
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
        </div>
      </div>
    </>
  );
}

export function ShellFallback() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]" aria-busy="true">
      <div className="hidden bg-navy lg:block" />
      <div className="px-4 py-10 text-sm text-muted sm:px-10">Loading…</div>
    </div>
  );
}
