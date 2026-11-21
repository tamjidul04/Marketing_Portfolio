'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/admin/icons';
import { deleteMessage, markMessageRead, saveMessageNote, setMessageStatus, type InboxResult } from '@/lib/actions/inbox';
import { NOTE_MAX, type MessageStatus } from '@/lib/inbox';

/**
 * Opening a new message marks it read. Runs in the browser on purpose: a server render can also
 * happen when Next.js PREFETCHES a link, which must not silently mark messages as read.
 * Runs once per message, so "Mark as unread" sticks.
 */
export function MarkRead({ id, isNew }: { id: string; isNew: boolean }) {
  const router = useRouter();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (handled.current === id) return;
    handled.current = id;
    if (!isNew) return;
    void markMessageRead(id).then((r) => r.ok && router.refresh());
  }, [id, isNew, router]);
  return null;
}

const btn = 'inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-4 text-sm font-bold text-muted transition hover:border-accent hover:text-foreground disabled:opacity-50';

type Move = { to: MessageStatus; label: string; icon: string };

function movesFor(status: MessageStatus): Move[] {
  switch (status) {
    case 'new':
      return [{ to: 'replied', label: 'Mark as replied', icon: 'check' }, { to: 'archived', label: 'Archive', icon: 'archive' }, { to: 'spam', label: 'Spam', icon: 'flag' }];
    case 'read':
      return [{ to: 'replied', label: 'Mark as replied', icon: 'check' }, { to: 'new', label: 'Mark as unread', icon: 'undo' }, { to: 'archived', label: 'Archive', icon: 'archive' }, { to: 'spam', label: 'Spam', icon: 'flag' }];
    case 'replied':
      return [{ to: 'new', label: 'Mark as unread', icon: 'undo' }, { to: 'archived', label: 'Archive', icon: 'archive' }, { to: 'spam', label: 'Spam', icon: 'flag' }];
    case 'archived':
      return [{ to: 'read', label: 'Move back to inbox', icon: 'inbox' }, { to: 'spam', label: 'Spam', icon: 'flag' }];
    case 'spam':
      return [{ to: 'read', label: 'Not spam (move to inbox)', icon: 'inbox' }];
  }
}

export function MessageActions({ id, status }: { id: string; status: MessageStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<InboxResult>) =>
    start(async () => {
      const r = await fn();
      if (r?.error) setError(r.error);
      else {
        setError(null);
        router.refresh();
      }
    });

  return (
    <section aria-label="Organise" className="grid gap-3">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {movesFor(status).map((m) => (
          <button key={m.to} type="button" disabled={pending} className={btn} onClick={() => run(() => setMessageStatus(id, m.to))}>
            <Icon name={m.icon} size={16} /> {m.label}
          </button>
        ))}
        <button
          type="button"
          disabled={pending}
          className={`${btn} hover:!border-red-300 hover:!text-red-600 sm:ml-auto`}
          onClick={() => window.confirm('Delete this message for good? This cannot be undone.') && run(() => deleteMessage(id))}
        >
          <Icon name="trash" size={16} /> Delete
        </button>
      </div>
      <p className="text-xs text-muted" aria-live="polite">{pending ? 'Saving…' : ''}</p>
    </section>
  );
}

/** Private note (never shown on the website): e.g. "Called on Monday, sending proposal". */
export function NoteEditor({ id, initial }: { id: string; initial: string }) {
  const router = useRouter();
  const [note, setNote] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const dirty = note.trim() !== initial.trim();

  return (
    <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
      <label htmlFor="note" className="font-extrabold">Private note</label>
      <p className="text-sm text-muted">Only you can see this. Useful for follow-ups, e.g. “Called on Monday, sending a proposal”.</p>
      <textarea
        id="note"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setMsg(null);
        }}
        maxLength={NOTE_MAX}
        rows={3}
        className="mt-3 w-full rounded-xl border border-line bg-background px-3 py-2.5 text-[15px] outline-none focus:border-accent focus:ring-4 focus:ring-accent/20"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() =>
            start(async () => {
              const r = await saveMessageNote(id, note);
              if (r.error) setMsg({ text: r.error, error: true });
              else {
                setMsg({ text: 'Note saved.' });
                router.refresh();
              }
            })
          }
          className="inline-flex min-h-11 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white disabled:opacity-40"
        >
          {pending ? 'Saving…' : 'Save note'}
        </button>
        <span className="text-xs text-muted">{note.length}/{NOTE_MAX}</span>
        {msg && <span role={msg.error ? 'alert' : 'status'} className={`text-sm font-semibold ${msg.error ? 'text-red-700' : 'text-emerald-700'}`}>{msg.text}</span>}
      </div>
    </section>
  );
}
