import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { SECTIONS } from '@/lib/forms/config';
import type { Field, Section } from '@/lib/forms/types';

/**
 * A section's fields with any choices that come from the database filled in
 * (today: a testimonial can be linked to one of your case studies).
 * The save action uses the same function, so the form and the server always agree on what is allowed.
 */
export async function fieldsFor(section: Section): Promise<Field[]> {
  if (section.slug !== 'testimonials') return section.fields;
  const db = await createClient();
  const { data, error } = await db.from('case_studies').select('id, title').order('sort_order', { ascending: true }).order('created_at', { ascending: true });
  if (error) throw new Error(`Could not load case studies: ${error.message}`);
  const options = (data ?? []).map((c) => ({ value: c.id, label: c.title }));
  return section.fields.map((f) => (f.name === 'case_study_id' ? { ...f, options } : f));
}

export { SECTIONS };
