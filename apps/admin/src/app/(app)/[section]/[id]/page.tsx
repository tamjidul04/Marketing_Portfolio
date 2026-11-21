import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CaseGallery } from '@/components/forms/case-gallery';
import { EntityForm } from '@/components/forms/entity-form';
import { saveItem } from '@/lib/actions/content';
import { requireAdmin } from '@/lib/auth';
import { SECTIONS, isSection } from '@/lib/forms/config';
import { fromDbCase } from '@/lib/forms/case-study';
import { toInitial } from '@/lib/forms/display';
import { fieldsFor } from '@/lib/forms/dynamic';
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
  const fields = await fieldsFor(cfg);
  const row = slug === 'case-studies' ? fromDbCase(data) : data;
  const gallery = slug === 'case-studies'
    ? ((await db.from('case_study_images').select('id, image_path, alt, caption').eq('case_study_id', id).order('sort_order').order('created_at')).data ?? [])
    : null;

  return (
    <div className="max-w-3xl">
      <Link href={`/${slug}`} className="text-sm font-bold text-muted hover:text-foreground">← {cfg.title}</Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Edit {cfg.singular}</h1>
      <p className="mb-6 mt-1 truncate text-muted">{String(data[cfg.titleField] ?? '')}</p>
      <EntityForm fields={fields} groups={cfg.groups} initial={toInitial(fields, row)} action={saveItem.bind(null, slug, id)} submitLabel="Save changes" cancelHref={`/${slug}`} />
      {gallery && (
        <div className="mt-8">
          <CaseGallery caseId={id} images={gallery} />
        </div>
      )}
    </div>
  );
}
