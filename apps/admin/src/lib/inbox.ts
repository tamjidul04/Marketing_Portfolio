// Inbox helpers. Pure (no framework imports) so they can be unit-tested.
// Message fields were typed by website visitors: treat them as untrusted when building links.

export const STATUSES = ['new', 'read', 'replied', 'archived', 'spam'] as const;
export type MessageStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<MessageStatus, string> = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
  spam: 'Spam',
};

/** The tabs of the inbox and which statuses each shows. */
export const VIEWS = {
  inbox: { label: 'Inbox', statuses: ['new', 'read', 'replied'] as MessageStatus[] },
  archived: { label: 'Archived', statuses: ['archived'] as MessageStatus[] },
  spam: { label: 'Spam', statuses: ['spam'] as MessageStatus[] },
} as const;
export type View = keyof typeof VIEWS;

export const PAGE_SIZE = 25;
export const NOTE_MAX = 2000;

export function isStatus(v: unknown): v is MessageStatus {
  return typeof v === 'string' && (STATUSES as readonly string[]).includes(v);
}

export function parseView(v: unknown): View {
  return typeof v === 'string' && Object.hasOwn(VIEWS, v) ? (v as View) : 'inbox';
}

/** ?page=3 → 3; anything odd → 1. Capped so a silly number can't ask for a huge offset. */
export function parsePage(v: unknown): number {
  const n = typeof v === 'string' && /^\d{1,4}$/.test(v) ? Number(v) : 1;
  return Math.min(Math.max(n, 1), 1000);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

/** Strict on purpose: the database accepts e.g. "a@b.co?bcc=x@y.z", which would inject into a mailto: link. */
const SAFE_EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}$/;

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

/** mailto: with a subject and greeting, or null when the address isn't plain enough to link safely. */
export function replyMailto(email: string | null | undefined, name: string, service?: string | null): string | null {
  if (!email || !SAFE_EMAIL_RE.test(email)) return null;
  const subject = service ? `Re: your enquiry about ${service}` : 'Re: your enquiry';
  const body = `Hi ${firstName(name)},\n\nThank you for getting in touch.\n\n`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function digitsOf(phone: string | null | undefined): string | null {
  const d = (phone ?? '').replace(/\D/g, '');
  return d.length >= 7 && d.length <= 15 ? d : null;
}

export function whatsappHref(phone: string | null | undefined, name: string): string | null {
  const d = digitsOf(phone);
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(`Hi ${firstName(name)}, thank you for your message. `)}` : null;
}

export function telHref(phone: string | null | undefined): string | null {
  const d = digitsOf(phone);
  if (!d) return null;
  return `tel:${(phone ?? '').trim().startsWith('+') ? '+' : ''}${d}`;
}

/** A website page path ("/work/x") that's safe to link to; anything else → null. */
export function safeSourcePath(p: string | null | undefined): string | null {
  return p && /^\/[A-Za-z0-9/_-]{0,200}$/.test(p) && !p.startsWith('//') ? p : null;
}

/** Short preview of the message for the list. */
export function snippet(message: string | null | undefined, max = 140): string {
  const t = (message ?? '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

/** Validates a private note: trims, empty → null, too long → error. */
export function cleanNote(v: unknown): { ok: true; note: string | null } | { ok: false; error: string } {
  if (typeof v !== 'string') return { ok: false, error: 'The note could not be read.' };
  const t = v.replace(/\r\n?/g, '\n').trim();
  if (t.length > NOTE_MAX) return { ok: false, error: `Please keep the note under ${NOTE_MAX.toLocaleString('en')} characters.` };
  return { ok: true, note: t || null };
}
