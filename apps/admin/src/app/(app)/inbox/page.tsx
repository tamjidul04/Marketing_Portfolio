import Link from 'next/link';
import { Suspense } from 'react';
import { Icon } from '@/components/admin/icons';
import { requireAdmin } from '@/lib/auth';
import { timeAgo } from '@/lib/format';
import { PAGE_SIZE, STATUS_LABEL, VIEWS, parsePage, parseView, snippet, type View } from '@/lib/inbox';
import { createClient } from '@/lib/supabase/server';

export default function InboxPage({ searchParams }: PageProps<'/inbox'>) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Inbox searchParams={searchParams} />
    </Suspense>
  );
}

const NOTICES: Record<string, string> = { deleted: 'Message deleted.' };

async function Inbox({ searchParams }: { searchParams: PageProps<'/inbox'>['searchParams'] }) {
  const sp = await searchParams;
  await requireAdmin();
  const view = parseView(sp.view);
  const page = parsePage(sp.page);
  const from = (page - 1) * PAGE_SIZE;

  const db = await createClient();
  const head = { count: 'exact' as const, head: true };
  const [list, newCount, ...tabCounts] = await Promise.all([
    db.from('contact_messages')
      .select('id, name, business, email, phone, service, budget, message, status, created_at', { count: 'exact' })
      .in('status', VIEWS[view].statuses)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    db.from('contact_messages').select('id', head).eq('status', 'new'),
    ...(Object.keys(VIEWS) as View[]).map((v) => db.from('contact_messages').select('id', head).in('status', VIEWS[v].statuses)),
  ]);
  if (list.error) throw new Error(`Could not load messages: ${list.error.message}`);

  const rows = list.data ?? [];
  const total = list.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const counts = Object.fromEntries((Object.keys(VIEWS) as View[]).map((v, i) => [v, tabCounts[i]?.count ?? 0])) as Record<View, number>;
  const unread = newCount.count ?? 0;
  const notice = typeof sp.notice === 'string' ? NOTICES[sp.notice] : undefined;
  const href = (v: View, p = 1) => `/inbox${v === 'inbox' && p === 1 ? '' : `?${new URLSearchParams({ ...(v !== 'inbox' ? { view: v } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`}`;

  return (
    <div className="grid grid-cols-1 gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Inbox</h1>
        <p className="mt-1 max-w-2xl text-muted">
          Messages from the consultation form on your website.{' '}
          {unread > 0 ? <strong className="text-foreground">{unread} new.</strong> : 'You are all caught up.'}
        </p>
      </header>

      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>}

      <nav aria-label="Message folders" className="flex flex-wrap gap-2">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link
            key={v}
            href={href(v)}
            aria-current={v === view ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${v === view ? 'border-navy bg-navy text-white' : 'border-line bg-card text-muted hover:border-accent hover:text-foreground'}`}
          >
            {VIEWS[v].label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${v === view ? 'bg-white/15' : 'bg-line'}`}>{counts[v]}</span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-14 text-center">
          <p className="text-lg font-extrabold">{view === 'inbox' ? 'No messages yet' : `Nothing in ${VIEWS[view].label}`}</p>
          <p className="mt-1 text-muted">
            {view === 'inbox' ? 'When someone fills in the consultation form on your website, it appears here.' : 'Messages you move here will show up in this list.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {rows.map((m) => {
            const isNew = m.status === 'new';
            return (
              <li key={m.id}>
                <Link href={`/inbox/${m.id}`} className="flex items-start gap-3 px-4 py-4 transition hover:bg-accent-soft/40 sm:px-5">
                  <span className={`mt-2 size-2.5 shrink-0 rounded-full ${isNew ? 'bg-accent' : 'bg-transparent'}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`truncate ${isNew ? 'font-extrabold' : 'font-semibold'}`}>{m.name}</span>
                      {m.business && <span className="truncate text-sm text-muted">· {m.business}</span>}
                      {isNew ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-on-accent">New</span>
                      ) : m.status === 'replied' ? (
                        <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">{STATUS_LABEL.replied}</span>
                      ) : null}
                    </p>
                    <p className={`mt-0.5 line-clamp-2 text-sm ${isNew ? 'text-foreground' : 'text-muted'}`}>{snippet(m.message) || <em>(no message)</em>}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      {m.service && <span className="font-semibold text-accent-text">{m.service}</span>}
                      {m.budget && <span>{m.budget}</span>}
                      {m.email && <span className="inline-flex items-center gap-1"><Icon name="mail" size={12} />{m.email}</span>}
                      {m.phone && <span className="inline-flex items-center gap-1"><Icon name="phone" size={12} />{m.phone}</span>}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted" dateTime={m.created_at} title={new Date(m.created_at).toLocaleString('en-GB')}>
                    {timeAgo(m.created_at)}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3 text-sm font-bold">
          {page > 1 ? <Link href={href(view, page - 1)} className="inline-flex min-h-11 items-center rounded-xl border border-line bg-card px-4 hover:border-accent">← Newer</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={href(view, page + 1)} className="inline-flex min-h-11 items-center rounded-xl border border-line bg-card px-4 hover:border-accent">Older →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
