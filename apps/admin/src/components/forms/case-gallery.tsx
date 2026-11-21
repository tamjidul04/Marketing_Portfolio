'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addGalleryImages, deleteGalleryImage, reorderGallery, updateGalleryImage, type GalleryResult } from '@/lib/actions/gallery';
import { DragHandle, SortableList, type HandleProps } from '@/components/sortable';
import { mediaPublicUrl } from '@/lib/supabase/browser';
import { discardUpload, uploadImage } from '@/lib/upload-client';
import { ALLOWED_TYPES } from '@/lib/media';

type Img = { id: string; image_path: string; alt: string; caption: string | null };

const smallBtn = 'grid size-10 place-items-center rounded-xl border border-line bg-card text-muted hover:border-accent hover:text-foreground disabled:opacity-30';
const inputCls = 'w-full min-h-11 rounded-xl border border-line bg-background px-3 text-[15px] outline-none focus:border-accent focus:ring-4 focus:ring-accent/20';

function Row({ caseId, img, handle, onDone }: { caseId: string; img: Img; handle: HandleProps; onDone: (r: GalleryResult) => void }) {
  const [alt, setAlt] = useState(img.alt);
  const [caption, setCaption] = useState(img.caption ?? '');
  const [pending, start] = useTransition();
  const dirty = alt !== img.alt || caption !== (img.caption ?? '');
  const run = (fn: () => Promise<GalleryResult>) => start(async () => onDone(await fn()));
  return (
    <div className="grid gap-3 rounded-2xl border border-line bg-card p-3 sm:grid-cols-[auto_8rem_minmax(0,1fr)_auto] sm:items-center">
      <DragHandle {...handle} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaPublicUrl(img.image_path)} alt="" className="h-24 w-full rounded-xl object-cover sm:w-32" />
      <div className="grid gap-2">
        <input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={200} placeholder="Describe the image (for screen readers)" aria-label="Image description" className={inputCls} />
        <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} placeholder="Caption shown under it (optional)" aria-label="Caption" className={inputCls} />
        {dirty && (
          <button type="button" disabled={pending} onClick={() => run(() => updateGalleryImage(caseId, img.id, alt, caption))} className="w-fit rounded-xl bg-accent px-4 py-2 text-sm font-bold text-on-accent disabled:opacity-60">
            {pending ? 'Saving…' : 'Save text'}
          </button>
        )}
      </div>
      <div className="flex gap-2 sm:flex-col">
        <button type="button" className={`${smallBtn} hover:!border-red-300 hover:!text-red-600`} disabled={pending} aria-label="Delete image"
          onClick={() => window.confirm('Delete this screenshot? This cannot be undone.') && run(() => deleteGalleryImage(caseId, img.id))}>×</button>
      </div>
    </div>
  );
}

/** Screenshots shown on the case study page. Saved immediately (separately from the form above). */
export function CaseGallery({ caseId, images }: { caseId: string; images: Img[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState(images);
  const [, startMove] = useTransition();

  // drag & drop: show the new order at once, save in the background, snap back if saving fails
  function move(ids: string[]) {
    const before = order;
    const byId = new Map(order.map((i) => [i.id, i]));
    setOrder(ids.map((id) => byId.get(id)!));
    startMove(async () => {
      const r = await reorderGallery(caseId, ids);
      if (r.error) {
        setOrder(before);
        setError(r.error);
      }
    });
  }

  const done = (r: GalleryResult) => {
    if (r.error) setError(r.error);
    else {
      setError(null);
      router.refresh();
    }
  };

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const paths: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setBusy(`Optimising & uploading ${i + 1} of ${files.length}…`);
        paths.push(await uploadImage(files[i], 'gallery', 2000));
      }
      setBusy('Saving…');
      done(await addGalleryImages(caseId, paths));
    } catch (e) {
      await Promise.all(paths.map(discardUpload)); // don't leave half a batch behind
      setError(e instanceof Error ? e.message : 'The upload failed.');
    } finally {
      setBusy(null);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-5 sm:p-6" aria-labelledby="gallery-title">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="gallery-title" className="text-lg font-extrabold">Screenshots</h2>
          <p className="text-sm text-muted">Shown on the case study page (ad results, dashboards, creatives). Saved straight away, separately from the form above.</p>
        </div>
        <button type="button" disabled={!!busy} onClick={() => input.current?.click()} className="inline-flex min-h-11 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white disabled:opacity-60">
          {busy ?? '+ Add screenshots'}
        </button>
        <input ref={input} type="file" multiple accept={ALLOWED_TYPES.join(',')} className="sr-only" aria-label="Add screenshots" onChange={(e) => void upload(e.target.files)} />
      </header>
      {error && <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</p>}
      {order.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">No screenshots yet.</p>
      ) : (
        <SortableList items={order} labelOf={(img) => img.alt || `screenshot ${order.indexOf(img) + 1}`} onMove={move} className="grid gap-3">
          {(img, handle) => <Row caseId={caseId} img={img} handle={handle} onDone={done} />}
        </SortableList>
      )}
    </section>
  );
}
