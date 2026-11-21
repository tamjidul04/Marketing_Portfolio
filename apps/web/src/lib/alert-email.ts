// Builds the "new enquiry" alert email. Pure (no imports) so it can be unit-tested.
// Everything the visitor typed is untrusted: it is HTML-escaped, and line breaks are
// stripped from the subject so nobody can inject extra email headers.

export type AlertInput = {
  id: string;
  name: string;
  business?: string;
  email?: string;
  phone?: string;
  service?: string;
  budget?: string;
  message?: string;
  sourcePath?: string;
};

export type AlertEmail = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
};

const EMAIL_RE = /^[^@\s,<>"]+@[^@\s,<>"]+\.[^@\s,<>"]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL = /[\u0000-\u001f\u007f\u2028\u2029]+/g;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** One line, no control characters, at most `max` characters. */
export function oneLine(s: string, max: number): string {
  const t = s.replace(CONTROL, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

/** "a@x.co, b@y.co" → valid addresses only (max 3). */
export function parseRecipients(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length <= 254 && EMAIL_RE.test(s))
    .slice(0, 3);
}

/** wa.me link for a phone number, or null when there are too few digits. */
export function whatsappLink(phone: string | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
}

export function buildAlertEmail(m: AlertInput, opts: { from: string; to: string[]; adminUrl: string }): AlertEmail {
  const name = oneLine(m.name, 100) || "Someone";
  const business = m.business ? oneLine(m.business, 120) : "";
  const subject = oneLine(`New enquiry from ${name}${business ? ` (${business})` : ""}`, 150);

  const base = opts.adminUrl.replace(/\/+$/, "");
  const inboxUrl = UUID_RE.test(m.id) ? `${base}/inbox/${m.id}` : `${base}/inbox`;
  const email = m.email && EMAIL_RE.test(m.email) ? m.email : undefined;
  const wa = whatsappLink(m.phone);

  const rows: [string, string][] = [
    ["Name", name],
    ["Business", business],
    ["Email", email ?? ""],
    ["Phone / WhatsApp", m.phone ? oneLine(m.phone, 30) : ""],
    ["Service", m.service ? oneLine(m.service, 80) : ""],
    ["Budget", m.budget ? oneLine(m.budget, 60) : ""],
    ["Sent from page", m.sourcePath ? oneLine(m.sourcePath, 300) : ""],
  ].filter(([, v]) => v) as [string, string][];

  const message = (m.message ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 5000);

  const text = [
    subject,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    message ? `Message:\n${message}` : "(no message)",
    "",
    `Open in your inbox: ${inboxUrl}`,
    wa ? `WhatsApp: ${wa}` : "",
    email ? `Reply to this email to answer ${name} directly.` : "",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n").trim();

  const cell = "padding:6px 12px 6px 0;vertical-align:top;font:14px/1.5 Arial,sans-serif";
  const button = (href: string, label: string, bg: string) =>
    `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;border-radius:8px;background:${bg};color:#fff;font:bold 14px Arial,sans-serif;text-decoration:none">${label}</a>`;

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f6f9">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;color:#1B2A4A">
<h1 style="margin:0 0 16px;font:bold 20px Arial,sans-serif">${escapeHtml(subject)}</h1>
<table role="presentation" style="border-collapse:collapse;margin-bottom:16px">
${rows.map(([k, v]) => `<tr><td style="${cell};color:#5b6b85;white-space:nowrap">${escapeHtml(k)}</td><td style="${cell};font-weight:bold">${escapeHtml(v)}</td></tr>`).join("\n")}
</table>
${message ? `<div style="white-space:pre-wrap;padding:14px 16px;border-radius:8px;background:#f4f6f9;font:14px/1.6 Arial,sans-serif">${escapeHtml(message)}</div>` : `<p style="color:#5b6b85;font:14px Arial,sans-serif">(no message)</p>`}
<div style="margin-top:20px">${button(inboxUrl, "Open in inbox", "#1B2A4A")}${wa ? button(wa, "WhatsApp", "#128C4B") : ""}</div>
${email ? `<p style="margin:12px 0 0;color:#5b6b85;font:13px Arial,sans-serif">Reply to this email to answer ${escapeHtml(name)} directly.</p>` : ""}
</div></body></html>`;

  return { from: opts.from, to: opts.to, subject, html, text, ...(email ? { reply_to: email } : {}) };
}
