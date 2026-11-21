import { Suspense } from 'react';
import { Icon } from '@/components/admin/icons';
import { requireAdmin } from '@/lib/auth';
import { loadDashboard } from '@/lib/dashboard';
import { timeAgo } from '@/lib/format';

export const metadata = { title: 'Dashboard — Admin' };

export default function DashboardPage({ searchParams }: PageProps<'/'>) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

function StatCard({ label, value, sub, icon, highlight }: { label: string; value: number; sub?: string; icon: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-card p-4 sm:p-5 ${highlight ? 'border-accent shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_15%,transparent)]' : 'border-line'}`}>
      <div className="flex items-center justify-between text-muted">
        <span className="text-[13px] font-bold">{label}</span>
        <Icon name={icon} size={18} />
      </div>
      <p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
    </div>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<'/'>['searchParams'] }) {
  const admin = await requireAdmin();
  const [{ notice }, data] = await Promise.all([searchParams, loadDashboard()]);
  const { counts, latestMessages, checklist, progress } = data;
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const first = data.ownerName === 'Your Name' ? admin.email.split('@')[0] : data.ownerName.split(' ')[0];

  return (
    <div className="grid gap-8">
      {notice === 'password-updated' && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Your password was updated.
        </div>
      )}

      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome back, {first} 👋</h1>
        <p className="mt-1 text-muted">Here&apos;s what&apos;s happening on your website.</p>
      </header>

      <section aria-label="At a glance" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="New messages" value={counts.newMessages} sub={`${counts.messages} in total`} icon="inbox" highlight={counts.newMessages > 0} />
        <StatCard label="Case studies" value={counts.published} sub={counts.drafts ? `${counts.drafts} draft${counts.drafts === 1 ? '' : 's'}` : 'all published'} icon="briefcase" />
        <StatCard label="Testimonials" value={counts.testimonials} icon="quote" />
        <StatCard label="Services" value={counts.services} icon="target" />
        <StatCard label="Results" value={counts.stats} sub="numbers on the home page" icon="chart" />
        <StatCard label="FAQ" value={counts.faqs} icon="help" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="latest" className="rounded-2xl border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="latest" className="text-lg font-extrabold">Latest messages</h2>
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-text">{counts.newMessages} new</span>
          </div>
          {latestMessages.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-bold">No messages yet</p>
              <p className="mt-1 text-sm text-muted">When someone fills in the consultation form on your website, it appears here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {latestMessages.map((m) => (
                <li key={m.id} className="flex items-start gap-3 px-5 py-4">
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${m.status === 'new' ? 'bg-accent' : 'bg-line'}`} title={m.status} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{m.name}</p>
                    <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
                      {m.email && <span className="inline-flex items-center gap-1 truncate"><Icon name="mail" size={13} />{m.email}</span>}
                      {m.phone && <span className="inline-flex items-center gap-1"><Icon name="phone" size={13} />{m.phone}</span>}
                    </p>
                    {m.service && <p className="mt-1 text-xs font-semibold text-accent-text">{m.service}</p>}
                  </div>
                  <time className="shrink-0 text-xs text-muted" dateTime={m.created_at}>{timeAgo(m.created_at)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="setup" className="rounded-2xl border border-line bg-card">
          <div className="border-b border-line px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 id="setup" className="text-lg font-extrabold">Getting started</h2>
              <span className="text-sm font-bold text-muted">{progress.done}/{progress.total}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <ul className="divide-y divide-line">
            {checklist.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${item.done ? 'border-accent bg-accent text-on-accent' : 'border-line'}`}>
                  {item.done && <Icon name="check" size={12} />}
                </span>
                <div className="min-w-0">
                  <p className={`text-[15px] font-semibold ${item.done ? 'text-muted line-through' : ''}`}>
                    {item.label}
                    {item.optional && <span className="ml-2 text-[11px] font-bold uppercase tracking-wide text-muted no-underline">optional</span>}
                  </p>
                  {!item.done && <p className="text-xs text-muted">{item.hint}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid animate-pulse gap-8" aria-busy="true">
      <div className="h-16 w-2/3 rounded-xl bg-line" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-line" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-line" />
    </div>
  );
}
