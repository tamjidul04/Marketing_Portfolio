'use client';

import { useId, useRef, useState } from 'react';
import { mediaPublicUrl } from '@/lib/supabase/browser';
import { discardUpload, uploadImage } from '@/lib/upload-client';
import { ALLOWED_TYPES, type MediaFolder } from '@/lib/media';
import type { Field } from '@/lib/forms/types';

/**
 * Image picker for one field. Uploads straight to storage as soon as a file is chosen and keeps the new
 * path in a hidden input, so the image is saved together with the rest of the form.
 * Files uploaded here but then replaced/removed before saving are deleted again, so nothing is left behind.
 */
export function ImageField({ field, value, error }: { field: Field; value: string; error?: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState(value);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const fresh = useRef(new Set<string>()); // uploaded during this visit, not saved yet

  const forget = (p: string) => {
    if (p && fresh.current.has(p)) {
      fresh.current.delete(p);
      void discardUpload(p);
    }
  };

  async function handle(file: File | undefined) {
    if (!file) return;
    setProblem(null);
    setBusy(true);
    try {
      const newPath = await uploadImage(file, field.folder as MediaFolder, field.maxDim);
      fresh.current.add(newPath);
      forget(path);
      setPath(newPath);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'The upload failed.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  const shownError = problem ?? error;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {field.label}
      </label>
      <input type="hidden" name={field.name} value={path} />

      <div
        className={`flex flex-wrap items-center gap-4 rounded-2xl border-2 border-dashed p-3 transition ${over ? 'border-accent bg-accent-soft' : 'border-line'}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void handle(e.dataTransfer.files?.[0]);
        }}
      >
        <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
          {path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaPublicUrl(path)} alt="" className="size-full object-contain" />
          ) : (
            <span className="px-2 text-center text-xs font-semibold text-muted">No image</span>
          )}
        </div>
        <div className="grid min-w-0 flex-1 gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => input.current?.click()}
              className="inline-flex min-h-11 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? 'Optimising & uploading…' : path ? 'Replace image' : 'Upload image'}
            </button>
            {path && !busy && (
              <button
                type="button"
                onClick={() => {
                  forget(path);
                  setPath('');
                }}
                className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-bold text-muted hover:border-red-300 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-[13px] text-muted">
            {field.sizeHint ? `${field.sizeHint} ` : ''}JPG, PNG, WebP or GIF, up to 5 MB. You can also drag a file here.
          </p>
          <span aria-live="polite" className="sr-only">{busy ? 'Uploading' : ''}</span>
        </div>
        <input
          ref={input}
          id={id}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className="sr-only"
          aria-describedby={shownError ? `${id}-err` : undefined}
          onChange={(e) => void handle(e.target.files?.[0])}
        />
      </div>
      {shownError && (
        <p id={`${id}-err`} role="alert" className="text-sm font-medium text-red-700">
          {shownError}
        </p>
      )}
    </div>
  );
}
