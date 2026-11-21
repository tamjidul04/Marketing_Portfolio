import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { EntityForm } from '@/components/forms/entity-form';
import { saveItem } from '@/lib/actions/content';
import { requireAdmin } from '@/lib/auth';
import { SECTIONS, isSection } from '@/lib/forms/config';
import { toInitial } from '@/lib/forms/display';
import { fieldsFor } from '@/lib/forms/dynamic';

export default function NewItemPage({ params }: PageProps<'/[section]/new'>) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Form params={params} />
    </Suspense>
  );
}

async function Form({ params }: { params: PageProps<'/[section]/new'>['params'] }) {
  const { section: slug } = await params;
  if (!isSection(slug)) notFound();
  await requireAdmin();
  const cfg = SECTIONS[slug];
  const fields = await fieldsFor(cfg);

  return (
    <div className="max-w-3xl">
      <Link href={`/${slug}`} className="text-sm font-bold text-muted hover:text-foreground">← {cfg.title}</Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Add {cfg.singular}</h1>
      <p className="mb-6 mt-1 text-muted">{cfg.blurb}</p>
      <EntityForm fields={fields} groups={cfg.groups} initial={toInitial(fields, null)} action={saveItem.bind(null, slug, null)} submitLabel={`Add ${cfg.singular}`} cancelHref={`/${slug}`} />
    </div>
  );
}
