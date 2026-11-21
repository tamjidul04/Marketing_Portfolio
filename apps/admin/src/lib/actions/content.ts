'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PROFILE_FIELDS, SECTIONS, SETTINGS_FIELDS, isSection } from '@/lib/forms/config';
import { toDbCase } from '@/lib/forms/case-study';
import { fieldsFor } from '@/lib/forms/dynamic';
import { formSource, readValues, validateFields } from '@/lib/forms/validate';
import { planReorder, type OrderRow } from '@/lib/forms/reorder';
import { removeMedia, replacedImages } from '@/lib/storage';
import type { Field, FormState, Section } from '@/lib/forms/types';

/*
 * Every action:
 *   1. re-checks that the caller is an admin (never trusts the browser),
 *   2. only accepts a section name from the SECTIONS list (so no arbitrary table can be targeted),
 *   3. only writes the fields listed in the config (extra form fields are ignored),
 *   4. is checked a third time by the database's row-level security.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC_ERROR = 'Sorry, that could not be saved. Please try again.';
const SLUG_TAKEN = 'Another case study already uses this web address. Choose a different one.';

// The table name is chosen from a fixed list, so the generic (untyped) query builder is safe here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function table(section: Section): Promise<any> {
  const db = await createClient();
  return db.from(section.table);
}

const imageCols = (fields: Field[]) => fields.filter((f) => f.type === 'image').map((f) => f.name);

function sectionOf(slug: string): Section | null {
  return isSection(slug) ? SECTIONS[slug] : null;
}

function refresh(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath('/');
}

/* ------------------------------------------------------------------ */
/*  Create or update one item in a list                                */
/* ------------------------------------------------------------------ */
export async function saveItem(slug: string, id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const section = sectionOf(slug);
  if (!section || (id !== null && !UUID_RE.test(id))) return { error: GENERIC_ERROR };

  const src = formSource(formData);
  const fields = await fieldsFor(section);
  const values = readValues(fields, src);
  const result = validateFields(fields, src);
  if (!result.ok) return { errors: result.errors, values };
  const payload = slug === 'case-studies' ? toDbCase(result.data) : result.data;

  const t = await table(section);
  if (id) {
    const cols = imageCols(fields);
    const before = cols.length ? ((await t.select(cols.join(',')).eq('id', id).maybeSingle()).data as Record<string, unknown> | null) : null;
    const { data, error } = await t.update(payload).eq('id', id).select('id');
    if (error) {
      if (error.code === '23505') return { errors: { slug: SLUG_TAKEN }, values };
      console.error(`update ${section.table} failed:`, error.code, error.message);
      return { error: GENERIC_ERROR, values };
    }
    if (!data || data.length === 0) return { error: 'That item no longer exists. It may have been deleted.', values };
    await removeMedia(replacedImages(fields, before, payload));
  } else {
    // new items go to the end of the list
    const { data: last, error: e1 } = await t.select('sort_order').order('sort_order', { ascending: false }).limit(1);
    if (e1) {
      console.error(`read ${section.table} order failed:`, e1.code, e1.message);
      return { error: GENERIC_ERROR, values };
    }
    const next = (last?.[0]?.sort_order ?? 0) + 1;
    const { error } = await t.insert({ ...payload, sort_order: next });
    if (error) {
      if (error.code === '23505') return { errors: { slug: SLUG_TAKEN }, values };
      console.error(`insert ${section.table} failed:`, error.code, error.message);
      return { error: GENERIC_ERROR, values };
    }
  }

  refresh(slug);
  redirect(`/${slug}?notice=saved`);
}

/* ------------------------------------------------------------------ */
/*  Delete, hide/show, move                                            */
/* ------------------------------------------------------------------ */
export async function deleteItem(slug: string, id: string): Promise<void> {
  await requireAdmin();
  const section = sectionOf(slug);
  if (!section || !UUID_RE.test(id)) return;
  const t = await table(section);
  const cols = imageCols(section.fields);
  const files: unknown[] = [];
  if (cols.length) {
    const { data } = await t.select(cols.join(',')).eq('id', id).maybeSingle();
    if (data) files.push(...cols.map((c) => (data as Record<string, unknown>)[c]));
  }
  if (slug === 'case-studies') {
    const db = await createClient();
    const { data } = await db.from('case_study_images').select('image_path').eq('case_study_id', id);
    files.push(...(data ?? []).map((r) => r.image_path));
  }
  const { error } = await t.delete().eq('id', id);
  if (error) console.error(`delete ${section.table} failed:`, error.code, error.message);
  else await removeMedia(files);
  refresh(slug);
  redirect(`/${slug}?notice=${error ? 'error' : 'deleted'}`);
}

export async function toggleVisible(slug: string, id: string): Promise<void> {
  await requireAdmin();
  const section = sectionOf(slug);
  if (!section || !UUID_RE.test(id)) return;
  const t = await table(section);
  if (slug === 'case-studies') {
    // case studies are published / unpublished rather than shown / hidden
    const { data, error } = await t.select('status').eq('id', id).maybeSingle();
    if (!error && data) {
      const { error: e2 } = await t.update({ status: data.status === 'published' ? 'draft' : 'published' }).eq('id', id);
      if (e2) console.error('publish toggle failed:', e2.code, e2.message);
    }
    refresh(slug);
    return;
  }
  const { data, error } = await t.select('is_visible').eq('id', id).maybeSingle();
  if (!error && data) {
    const { error: e2 } = await t.update({ is_visible: !data.is_visible }).eq('id', id);
    if (e2) console.error(`toggle ${section.table} failed:`, e2.code, e2.message);
  }
  refresh(slug);
}

/** Save a new order for a whole list (sent by drag-and-drop). Returns an error instead of redirecting. */
export async function reorderItems(slug: string, orderedIds: unknown): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const section = sectionOf(slug);
  if (!section) return { error: 'Unknown list.' };
  const t = await table(section);
  const { data: rows, error } = await t.select('id, sort_order');
  if (error || !rows) {
    console.error(`read ${section.table} order failed:`, error?.code, error?.message);
    return { error: 'Could not save the new order. Please try again.' };
  }
  const plan = planReorder(rows as OrderRow[], orderedIds);
  if (!plan.ok) return { error: plan.error === 'the list changed; please reload' ? 'The list changed in the meantime. Please reload the page.' : 'Could not save the new order.' };
  for (const u of plan.updates) {
    const { error: e2 } = await t.update({ sort_order: u.sort_order }).eq('id', u.id);
    if (e2) {
      console.error(`reorder ${section.table} failed:`, e2.code, e2.message);
      return { error: 'Could not save the new order. Please try again.' };
    }
  }
  refresh(slug);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  The two single-row screens                                         */
/* ------------------------------------------------------------------ */
async function saveSingle(tableName: 'profile' | 'site_settings', fields: Field[], path: string, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const src = formSource(formData);
  const values = readValues(fields, src);
  const result = validateFields(fields, src);
  if (!result.ok) return { errors: result.errors, values };

  const db = await createClient();
  const cols = imageCols(fields);
  const before = cols.length ? ((await db.from(tableName).select(cols.join(',')).eq('id', 1).maybeSingle()).data as Record<string, unknown> | null) : null;
  const { data, error } = await db.from(tableName).update(result.data as never).eq('id', 1).select('id');
  if (error) {
    console.error(`update ${tableName} failed:`, error.code, error.message);
    return { error: GENERIC_ERROR, values };
  }
  if (!data || data.length === 0) return { error: 'Nothing was saved (permission denied).', values };
  await removeMedia(replacedImages(fields, before, result.data));

  revalidatePath(path);
  revalidatePath('/');
  return { ok: true, values, savedAt: Date.now() };
}

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveSingle('profile', PROFILE_FIELDS, '/profile', formData);
}

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveSingle('site_settings', SETTINGS_FIELDS, '/settings', formData);
}
