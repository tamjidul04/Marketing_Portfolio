import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { MEDIA_FOLDERS, isMediaPath } from '@/lib/media';

const isOurs = (p: unknown): p is string => MEDIA_FOLDERS.some((f) => isMediaPath(p, f));

/**
 * Delete files from the media bucket (best effort; runs as the signed-in admin, storage rules apply).
 * Only paths in this app's own format are ever passed to storage.
 */
export async function removeMedia(paths: unknown[]): Promise<void> {
  const list = [...new Set(paths.filter(isOurs))];
  if (list.length === 0) return;
  const db = await createClient();
  const { error } = await db.storage.from('media').remove(list);
  if (error) console.error('storage cleanup failed:', error.message);
}

export { replacedImages } from '@/lib/media';
