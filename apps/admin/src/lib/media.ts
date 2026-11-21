// Pure rules for uploaded images (no framework imports, unit-tested). Used by the browser (before
// uploading) and by the server (before saving a path), so both sides apply the same rules.

/** Folders inside the "media" storage bucket. A saved path must live in the folder its field expects. */
export const MEDIA_FOLDERS = ['profile', 'og', 'brands', 'badges', 'cases', 'gallery', 'people'] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

/** Must match the bucket settings (supabase/migrations/…_security.sql). SVG is deliberately excluded: it can contain scripts. */
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'] as const;
export const MAX_BYTES = 5 * 1024 * 1024;

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };
const PATH_RE = /^([a-z]+)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png|avif|gif)$/;

/** Why a picked file can't be uploaded, or null if it's fine. `size` is checked AFTER resizing. */
export function fileProblem(file: { type: string; size: number }): string | null {
  if (file.type === 'image/svg+xml') return 'SVG files are not allowed (they can contain code). Please use PNG, JPG or WebP.';
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) return 'Please choose a JPG, PNG, WebP, AVIF or GIF image.';
  if (file.size <= 0) return 'That file is empty.';
  if (file.size > MAX_BYTES) return `That image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). The limit is 5 MB.`;
  return null;
}

/** A new, unguessable path for an upload: "<folder>/<random id>.<ext>". */
export function newMediaPath(folder: MediaFolder, contentType: string, id: string): string {
  const ext = EXT[contentType];
  if (!ext) throw new Error(`unsupported type ${contentType}`);
  return `${folder}/${id.toLowerCase()}.${ext}`;
}

/** True when `path` is a path this app could have created, in the expected folder. Blocks "../", other folders, URLs, etc. */
export function isMediaPath(path: unknown, folder: MediaFolder): path is string {
  if (typeof path !== 'string' || path.length > 120) return false;
  const m = PATH_RE.exec(path);
  return !!m && m[1] === folder;
}

/** Size to draw an image at so its longest side is at most `maxDim`. Never enlarges. */
export function fitWithin(width: number, height: number, maxDim: number): { width: number; height: number; scaled: boolean } {
  if (!(width > 0 && height > 0)) return { width: 0, height: 0, scaled: false };
  const longest = Math.max(width, height);
  if (longest <= maxDim) return { width, height, scaled: false };
  const k = maxDim / longest;
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)), scaled: true };
}

/** Animated GIFs would lose their animation if redrawn, so they are uploaded as they are. */
export const shouldConvert = (type: string) => type !== 'image/gif';

/**
 * Image paths that were replaced or cleared between the old row and the newly saved data
 * (so the old files can be deleted from storage). Unchanged or never-set images are not returned.
 */
export function replacedImages(fields: { type: string; name: string }[], before: Record<string, unknown> | null, after: Record<string, unknown>): unknown[] {
  if (!before) return [];
  return fields.filter((f) => f.type === 'image' && f.name in after && before[f.name] && before[f.name] !== after[f.name]).map((f) => before[f.name]);
}
