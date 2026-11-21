import { Suspense } from 'react';
import { EntityForm } from '@/components/forms/entity-form';
import { saveSettings } from '@/lib/actions/content';
import { requireAdmin } from '@/lib/auth';
import { SETTINGS_FIELDS, SETTINGS_GROUPS } from '@/lib/forms/config';
import { toInitial } from '@/lib/forms/display';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Site settings — Admin' };

export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Site settings</h1>
      <p className="mb-6 mt-1 text-muted">Contact details, search appearance, tracking, colours and which sections show.</p>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  await requireAdmin();
  const db = await createClient();
  const { data, error } = await db.from('site_settings').select('*').eq('id', 1).single();
  if (error) throw new Error(`Could not load settings: ${error.message}`);
  return <EntityForm fields={SETTINGS_FIELDS} groups={SETTINGS_GROUPS} initial={toInitial(SETTINGS_FIELDS, data)} action={saveSettings} submitLabel="Save settings" themePreview />;
}
