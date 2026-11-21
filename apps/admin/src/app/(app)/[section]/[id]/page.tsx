import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { EntityForm } from '@/components/forms/entity-form';
import { saveItem } from '@/lib/actions/content';
import { requireAdmin } from '@/lib/auth';
import { SECTIONS, isSection } from '@/lib/forms/config';
import { toInitial } from '@/lib/forms/display';
import { createClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EditItemPage({ params }: PageProps<'/[section]/[id]'>) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Form params={params} />
    </Suspense>
  );
}

async function Form({ params }: { params: PageProps<'/[section]/[id]'>['params'] }) {
  const { section: slug, id } = await params;
  if (!isSection(slug) || !UUID_RE.test(id)) notFound();
  await requireAdmin();
  const cfg = SECTIONS[slug];

  const db = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db.from(cfg.table) as any).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Could not load this ${cfg.singular}: ${error.message}`);
  if (!data) notFound();

  return (
    <div className="max-w-3xl">
      <Link href={`/${slug}`} className="text-sm font-bold text-muted hover:text-foreground">← {cfg.title}</Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Edit {cfg.singular}</h1>
      <p className="mb-6 mt-1 truncate text-muted">{String(data[cfg.titleField] ?? '')}</p>
      <EntityForm fields={cfg.fields} initial={toInitial(cfg.fields, data)} action={saveItem.bind(null, slug, id)} submitLabel="Save changes" cancelHref={`/${slug}`} />
    </div>
  );
}
