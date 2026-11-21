import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SectionRows, type RowData } from '@/components/forms/section-rows';
import { requireAdmin } from '@/lib/auth';
import { SECTIONS, isSection } from '@/lib/forms/config';
import { captionFor } from '@/lib/forms/display';
import { SITE_URL } from '@/lib/env';
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

const HEX_RE = /^#[0-9a-f]{6}$/i;

async function List({ params, searchParams }: { params: PageProps<'/[section]'>['params']; searchParams: PageProps<'/[section]'>['searchParams'] }) {
  const [{ section: slug }, { notice }] = await Promise.all([params, searchParams]);
  if (!isSection(slug)) notFound();
  await requireAdmin();
  const cfg = SECTIONS[slug];
  const isCase = slug === 'case-studies';

  // typed loosely on purpose: the table comes from a fixed list and every section has the same base columns
  const db = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db.from(cfg.table) as any).select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true });
  if (error) throw new Error(`Could not load ${cfg.title}: ${error.message}`);
  const raw = (data ?? []) as Record<string, unknown>[];
  const note = typeof notice === 'string' ? NOTICES[notice] : undefined;

  // only what the browser needs, nothing more
  const rows: RowData[] = raw.map((row) => {
    const visible = isCase ? row.status === 'published' : row.is_visible !== false;
    const swatch = (row.card_color ?? row.avatar_color ?? (slug === 'tools' ? row.color : null)) as string | null;
    return {
      id: String(row.id),
      title: String(row[cfg.titleField] ?? '(untitled)'),
      caption: captionFor(slug, row),
      visible,
      swatch: swatch && HEX_RE.test(swatch) ? swatch : null,
      badge: isCase && visible && row.is_featured === false ? 'Not on home page' : null,
      viewUrl: isCase && visible && typeof row.slug === 'string' ? `${SITE_URL}/work/${row.slug}` : null,
    };
  });

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
        // key: when the saved list changes (add/delete/refresh), start again from the server's order
        <SectionRows key={rows.map((r) => r.id + (r.visible ? '1' : '0')).join(',')} slug={slug} rows={rows} isCase={isCase} />
      )}
    </div>
  );
}
