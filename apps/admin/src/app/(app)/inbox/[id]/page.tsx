import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Icon } from '@/components/admin/icons';
import { MarkRead, MessageActions, NoteEditor } from '@/components/inbox/message-actions';
import { requireAdmin } from '@/lib/auth';
import { SITE_URL } from '@/lib/env';
import { timeAgo } from '@/lib/format';
import { STATUS_LABEL, isUuid, replyMailto, safeSourcePath, telHref, whatsappHref } from '@/lib/inbox';
import { createClient } from '@/lib/supabase/server';

export default function MessagePage({ params }: PageProps<'/inbox/[id]'>) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Message params={params} />
    </Suspense>
  );
}

const linkBtn = 'inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-[15px] font-bold transition hover:-translate-y-0.5';

async function Message({ params }: { params: PageProps<'/inbox/[id]'>['params'] }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  await requireAdmin();

  const db = await createClient();
  const { data: m, error } = await db
    .from('contact_messages')
    .select('id, name, business, email, phone, service, budget, message, status, admin_note, source_path, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Could not load this message: ${error.message}`);
  if (!m) notFound();

  const mailto = replyMailto(m.email, m.name, m.service);
  const wa = whatsappHref(m.phone, m.name);
  const tel = telHref(m.phone);
  const page = safeSourcePath(m.source_path);
  const sent = new Date(m.created_at);

  const details: [string, React.ReactNode][] = [
    ['Business', m.business],
    ['Email', m.email],
    ['Phone / WhatsApp', m.phone],
    ['Service', m.service],
    ['Budget', m.budget],
    ['Sent from', page ? <a href={`${SITE_URL}${page}`} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-4 hover:decoration-accent">{page}</a> : m.source_path],
  ];

  return (
    <div className="grid max-w-3xl gap-6">
      <MarkRead id={m.id} isNew={m.status === 'new'} />
      <div>
        <Link href={m.status === 'archived' ? '/inbox?view=archived' : m.status === 'spam' ? '/inbox?view=spam' : '/inbox'} className="text-sm font-bold text-muted hover:text-foreground">
          ← Inbox
        </Link>
        <h1 className="mt-2 break-words text-2xl font-extrabold tracking-tight sm:text-3xl">{m.name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          <time dateTime={m.created_at}>
            {sent.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {timeAgo(m.created_at)}
          </time>
          <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">{STATUS_LABEL[m.status]}</span>
        </p>
      </div>

      <section aria-label="Reply" className="flex flex-wrap gap-2">
        {mailto && (
          <a href={mailto} className={`${linkBtn} bg-accent text-on-accent shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_30%,transparent)]`}>
            <Icon name="reply" size={18} /> Reply by email
          </a>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={`${linkBtn} bg-[#128C4B] text-white`}>
            <Icon name="chat" size={18} /> WhatsApp
          </a>
        )}
        {tel && (
          <a href={tel} className={`${linkBtn} border border-line bg-card`}>
            <Icon name="phone" size={18} /> Call
          </a>
        )}
        {!mailto && !wa && !tel && <p className="text-sm text-muted">No usable contact details. Check the details below.</p>}
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 sm:p-6" aria-labelledby="msg-title">
        <h2 id="msg-title" className="sr-only">Message</h2>
        {m.message ? (
          <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed">{m.message}</p>
        ) : (
          <p className="italic text-muted">(No message. They only left their contact details.)</p>
        )}
        <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-line pt-5 sm:grid-cols-2">
          {details.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs font-bold uppercase tracking-wide text-muted">{k}</dt>
              <dd className="mt-0.5 select-all break-words font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* no key: a status change re-renders the page but must not wipe a note being typed */}
      <NoteEditor id={m.id} initial={m.admin_note ?? ''} />
      <MessageActions id={m.id} status={m.status} />
    </div>
  );
}
