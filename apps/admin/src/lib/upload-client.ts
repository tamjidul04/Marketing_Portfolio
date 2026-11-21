'use client';

import { browserClient } from '@/lib/supabase/browser';
import { fileProblem, fitWithin, newMediaPath, shouldConvert, type MediaFolder } from '@/lib/media';

/** Draw the image smaller (longest side = maxDim) and re-encode it as WebP (falls back if the browser can't). */
async function shrink(file: File, maxDim: number): Promise<Blob> {
  if (!shouldConvert(file.type)) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file); // honours the photo's rotation (EXIF) in current browsers
  } catch {
    throw new Error('That file could not be read as an image.');
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxDim);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not process the image.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const encode = (type: string, q?: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));
  const webp = await encode('image/webp', 0.85);
  if (webp && webp.type === 'image/webp') return webp;
  // very old browsers can't make WebP: keep PNG (transparency) or JPEG
  const fallback = await encode(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
  if (!fallback) throw new Error('Your browser could not process the image.');
  return fallback;
}

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('row-level security') || m.includes('unauthorized') || m.includes('403')) return 'Upload refused: you need to be signed in as an admin.';
  if (m.includes('mime') || m.includes('type')) return 'That type of file is not allowed.';
  if (m.includes('size') || m.includes('large')) return 'That image is too large (5 MB limit).';
  return 'The upload failed. Please check your connection and try again.';
}

/** Optimise and upload one image. Returns the new storage path to save in the form. */
export async function uploadImage(file: File, folder: MediaFolder, maxDim = 2000): Promise<string> {
  const typeProblem = fileProblem({ type: file.type, size: 1 });
  if (typeProblem) throw new Error(typeProblem);
  const blob = await shrink(file, maxDim);
  const problem = fileProblem({ type: blob.type, size: blob.size });
  if (problem) throw new Error(problem);
  const path = newMediaPath(folder, blob.type, crypto.randomUUID());
  const { error } = await browserClient().storage.from('media').upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
  if (error) throw new Error(friendly(error.message));
  return path;
}

/** Remove a file that was uploaded in this session but never saved (when replaced or removed before saving). */
export async function discardUpload(path: string): Promise<void> {
  await browserClient().storage.from('media').remove([path]).catch(() => {});
}
