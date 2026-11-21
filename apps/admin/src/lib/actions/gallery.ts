'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { isMediaPath } from '@/lib/media';
import { removeMedia } from '@/lib/storage';
import { createClient } from '@/lib/supabase/server';
import { planReorder } from '@/lib/forms/reorder';

/* Screenshots on a case study page (table case_study_images). Every action re-checks admin; RLS applies too. */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IMAGES = 24;
export type GalleryResult = { ok?: boolean; error?: string };

const clip = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/\u0000/g, '').trim().slice(0, max) : '');

export async function addGalleryImages(caseId: string, paths: string[]): Promise<GalleryResult> {
  await requireAdmin();
  if (!UUID_RE.test(caseId) || !Array.isArray(paths) || paths.length === 0) return { error: 'Nothing to add.' };
  if (!paths.every((p) => isMediaPath(p, 'gallery'))) return { error: 'One of the images could not be used. Please upload it again.' };
  const db = await createClient();
  const { data: existing, error: e1 } = await db.from('case_study_images').select('sort_order').eq('case_study_id', caseId).order('sort_order', { ascending: false });
  if (e1) return { error: 'Could not add the images. Please try again.' };
  if ((existing?.length ?? 0) + paths.length > MAX_IMAGES) {
    await removeMedia(paths);
    return { error: `A case study can have at most ${MAX_IMAGES} screenshots.` };
  }
  const start = (existing?.[0]?.sort_order ?? 0) + 1;
  const { error } = await db.from('case_study_images').insert(paths.map((image_path, i) => ({ case_study_id: caseId, image_path, alt: '', sort_order: start + i })));
  if (error) {
    console.error('add gallery images failed:', error.code, error.message);
    await removeMedia(paths);
    return { error: 'Could not add the images. Please try again.' };
  }
  revalidatePath(`/case-studies/${caseId}`);
  return { ok: true };
}

export async function updateGalleryImage(caseId: string, id: string, alt: string, caption: string): Promise<GalleryResult> {
  await requireAdmin();
  if (!UUID_RE.test(caseId) || !UUID_RE.test(id)) return { error: 'Not found.' };
  const db = await createClient();
  const { error } = await db.from('case_study_images').update({ alt: clip(alt, 200), caption: clip(caption, 200) || null }).eq('id', id).eq('case_study_id', caseId);
  if (error) return { error: 'Could not save. Please try again.' };
  revalidatePath(`/case-studies/${caseId}`);
  return { ok: true };
}

export async function deleteGalleryImage(caseId: string, id: string): Promise<GalleryResult> {
  await requireAdmin();
  if (!UUID_RE.test(caseId) || !UUID_RE.test(id)) return { error: 'Not found.' };
  const db = await createClient();
  const { data } = await db.from('case_study_images').select('image_path').eq('id', id).eq('case_study_id', caseId).maybeSingle();
  const { error } = await db.from('case_study_images').delete().eq('id', id).eq('case_study_id', caseId);
  if (error) return { error: 'Could not delete. Please try again.' };
  if (data) await removeMedia([data.image_path]);
  revalidatePath(`/case-studies/${caseId}`);
  return { ok: true };
}

export async function reorderGallery(caseId: string, orderedIds: unknown): Promise<GalleryResult> {
  await requireAdmin();
  if (!UUID_RE.test(caseId)) return { error: 'Not found.' };
  const db = await createClient();
  const { data: rows, error } = await db.from('case_study_images').select('id, sort_order').eq('case_study_id', caseId);
  if (error || !rows) return { error: 'Could not save the new order.' };
  const plan = planReorder(rows, orderedIds);
  if (!plan.ok) return { error: 'The screenshots changed in the meantime. Please reload the page.' };
  for (const u of plan.updates) {
    const { error: e2 } = await db.from('case_study_images').update({ sort_order: u.sort_order }).eq('id', u.id).eq('case_study_id', caseId);
    if (e2) return { error: 'Could not save the new order. Please try again.' };
  }
  revalidatePath(`/case-studies/${caseId}`);
  return { ok: true };
}
