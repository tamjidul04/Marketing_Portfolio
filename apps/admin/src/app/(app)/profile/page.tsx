import { Suspense } from 'react';
import { EntityForm } from '@/components/forms/entity-form';
import { saveProfile } from '@/lib/actions/content';
import { requireAdmin } from '@/lib/auth';
import { PROFILE_FIELDS, PROFILE_GROUPS } from '@/lib/forms/config';
import { toInitial } from '@/lib/forms/display';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Profile & hero — Admin' };

export default function ProfilePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Profile &amp; hero</h1>
      <p className="mb-6 mt-1 text-muted">Your name, headline and About text. Your photo upload arrives in step 3.4.</p>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  await requireAdmin();
  const db = await createClient();
  const { data, error } = await db.from('profile').select('*').eq('id', 1).single();
  if (error) throw new Error(`Could not load your profile: ${error.message}`);
  return <EntityForm fields={PROFILE_FIELDS} groups={PROFILE_GROUPS} initial={toInitial(PROFILE_FIELDS, data)} action={saveProfile} submitLabel="Save profile" />;
}
