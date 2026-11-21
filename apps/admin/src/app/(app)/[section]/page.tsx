import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ConfirmButton } from '@/components/forms/confirm-button';
import { Icon } from '@/components/admin/icons';
import { deleteItem, moveItem, toggleVisible } from '@/lib/actions/content';
import { requireAdmin } from '@/lib/auth';
import { SECTIONS, isSection } from '@/lib/forms/config';
import { captionFor } from '@/lib/forms/display';
import { createClient } from '@/lib/supabase/server';

export default function SectionListPage({ params, searchParams }: PageProps<'/[section]'>) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <List params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const NOTICES: Record<string, { text: string; error?: boolean }> = {
  saved: { text: 'Saved. Changes appear on your website within about a minute.' },
  deleted: { text: 'Deleted.' },
  error: { text: 'Sorry, that did not work. Please try again.', error: true },
};

const iconBtn =
  'grid size-11 place-items-center rounded-xl border border-line bg-card text-muted transition hover:border-accent hover:text-foreground disabled:opacity-30 disabled:hover:border-line';

async function List({ params, searchParams }: { params: PageProps<'/[section]'>['params']; searchParams: PageProps<'/[section]'>['searchParams'] }) {
  const [{ section: slug }, { notice }] = await Promise.all([params, searchParams]);
  if (!isSection(slug)) notFound();
  await requireAdmin();
  const cfg = SECTIONS[slug];

  // typed loosely on purpose: the table comes from a fixed list and every section has the same base columns
  const db = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db.from(cfg.table) as any).select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true });
  if (error) throw new Error(`Could not load ${cfg.title}: ${error.message}`);
  const rows = (data ?? []) as Record<string, unknown>[];
  const note = typeof notice === 'string' ? NOTICES[notice] : undefined;

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{cfg.title}</h1>
          <p className="mt-1 max-w-2xl text-muted">{cfg.blurb}</p>
        </div>
        <Link href={`/${slug}/new`} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-5 font-bold text-on-accent shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition hover:-translate-y-0.5">
          <span aria-hidden className="text-xl leading-none">+</span> Add {cfg.singular}
        </Link>
      </header>

      {note && (
        <div role={note.error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${note.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {note.text}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-14 text-center">
          <p className="text-lg font-extrabold">Nothing here yet</p>
          <p className="mt-1 text-muted">Add your first {cfg.singular} and it will show on your website.</p>
          <Link href={`/${slug}/new`} className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-accent px-5 font-bold text-on-accent">
            Add {cfg.singular}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map((row, i) => {
            const id = String(row.id);
            const visible = row.is_visible !== false;
            const title = String(row[cfg.titleField] ?? '(untitled)');
            const caption = captionFor(slug, row);
            return (
              <li key={id} className={`flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-3 sm:flex-nowrap sm:p-4 ${visible ? '' : 'opacity-70'}`}>
                <div className="flex flex-col gap-1">
                  <form action={moveItem.bind(null, slug, id, 'up')}>
                    <button className={`${iconBtn} !size-9`} disabled={i === 0} aria-label={`Move “${title}” up`}>↑</button>
                  </form>
                  <form action={moveItem.bind(null, slug, id, 'down')}>
                    <button className={`${iconBtn} !size-9`} disabled={i === rows.length - 1} aria-label={`Move “${title}” down`}>↓</button>
                  </form>
                </div>

                <div className="min-w-0 flex-1 basis-48">
                  <p className="flex flex-wrap items-center gap-2 font-extrabold">
                    <span className="truncate">{title}</span>
                    {!visible && <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">Hidden</span>}
                  </p>
                  {caption && <p className="truncate text-sm text-muted">{caption}</p>}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/${slug}/${id}`} className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-bold hover:border-accent">
                    Edit
                  </Link>
                  <form action={toggleVisible.bind(null, slug, id)}>
                    <button className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-bold text-muted hover:border-accent hover:text-foreground">
                      {visible ? 'Hide' : 'Show'}
                    </button>
                  </form>
                  <form action={deleteItem.bind(null, slug, id)}>
                    <ConfirmButton label={`Delete “${title}”`} message={`Delete “${title}”? This cannot be undone.`} className={`${iconBtn} hover:!border-red-300 hover:!text-red-600`}>
                      <Icon name="close" size={18} />
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
