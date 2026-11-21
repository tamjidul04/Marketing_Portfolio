'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Icon } from '@/components/admin/icons';
import { DragHandle, SortableList } from '@/components/sortable';
import { deleteItem, reorderItems, toggleVisible } from '@/lib/actions/content';

export type RowData = {
  id: string;
  title: string;
  caption: string;
  visible: boolean;
  swatch: string | null;
  badge: string | null;
  viewUrl: string | null;
};

const btn = 'inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-bold text-muted transition hover:border-accent hover:text-foreground disabled:opacity-50';

/**
 * The rows of a content list, reorderable by drag & drop. The new order appears at once and is saved
 * in the background; if saving fails, the list snaps back and says why.
 */
export function SectionRows({ slug, rows: initial, isCase }: { slug: string; rows: RowData[]; isCase: boolean }) {
  const [rows, setRows] = useState(initial);
  // Fresh data from the server (after an edit, add, delete or saved reorder) always wins over the local copy.
  const [fromServer, setFromServer] = useState(initial);
  if (initial !== fromServer) {
    setFromServer(initial);
    setRows(initial);
  }
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, start] = useTransition();

  function move(ids: string[]) {
    const before = rows;
    const byId = new Map(rows.map((r) => [r.id, r]));
    setRows(ids.map((id) => byId.get(id)!));
    setError(null);
    startSaving(async () => {
      const res = await reorderItems(slug, ids);
      if (res.error) {
        setRows(before);
        setError(res.error);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <p className="text-sm text-muted" aria-live="polite">
        {saving ? 'Saving the new order…' : 'Drag the ⠿ grip to change the order (or focus it and use Space + arrow keys).'}
      </p>
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
      <SortableList items={rows} labelOf={(r) => r.title} onMove={move} className="grid grid-cols-1 gap-3">
        {(row, handle) => (
          <div className={`flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-3 sm:flex-nowrap sm:p-4 ${row.visible ? '' : 'opacity-70'}`}>
            <DragHandle {...handle} />
            <div className="min-w-0 flex-1 basis-48">
              <p className="flex flex-wrap items-center gap-2 font-extrabold">
                {row.swatch && <span className="size-3.5 shrink-0 rounded-full border border-black/10" style={{ background: row.swatch }} aria-hidden />}
                <span className="truncate">{row.title}</span>
                {!row.visible && <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">{isCase ? 'Draft' : 'Hidden'}</span>}
                {row.badge && <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">{row.badge}</span>}
              </p>
              {row.caption && <p className="truncate text-sm text-muted">{row.caption}</p>}
            </div>
            <div className="flex max-w-full flex-wrap items-center gap-2 sm:shrink-0">
              <Link href={`/${slug}/${row.id}`} className={btn}>Edit</Link>
              {row.viewUrl && (
                <a href={row.viewUrl} target="_blank" rel="noopener noreferrer" className={btn}>View</a>
              )}
              <button
                type="button"
                disabled={busyId === row.id}
                className={btn}
                onClick={() => {
                  setBusyId(row.id);
                  start(async () => {
                    await toggleVisible(slug, row.id);
                    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, visible: !r.visible } : r)));
                    setBusyId(null);
                  });
                }}
              >
                {isCase ? (row.visible ? 'Unpublish' : 'Publish') : row.visible ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                aria-label={`Delete “${row.title}”`}
                disabled={busyId === row.id}
                className="grid size-11 place-items-center rounded-xl border border-line bg-card text-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                onClick={() => {
                  if (!window.confirm(`Delete “${row.title}”? This cannot be undone.`)) return;
                  setBusyId(row.id);
                  start(async () => {
                    await deleteItem(slug, row.id); // redirects back to the list with a "Deleted" notice
                  });
                }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          </div>
        )}
      </SortableList>
    </div>
  );
}
