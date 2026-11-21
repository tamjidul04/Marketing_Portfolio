import "server-only";
import { buildAlertEmail, parseRecipients, type AlertInput } from "@/lib/alert-email";

/**
 * Emails the site owner when the consultation form is sent (via Resend, https://resend.com).
 * Optional: with no RESEND_API_KEY or CONTACT_NOTIFY_EMAIL it does nothing — messages are
 * always saved in the admin inbox either way, so a failed alert never loses an enquiry.
 *
 *   RESEND_API_KEY        secret, server-only
 *   CONTACT_NOTIFY_EMAIL  where alerts go (up to 3, comma-separated)
 *   RESEND_FROM           sender; until your domain is verified in Resend keep the default,
 *                         which can only send to the email your Resend account uses
 */
export async function sendEnquiryAlert(m: AlertInput): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const to = parseRecipients(process.env.CONTACT_NOTIFY_EMAIL);
  if (!key || to.length === 0) {
    console.info("Enquiry alert skipped: set RESEND_API_KEY and CONTACT_NOTIFY_EMAIL to get emails.");
    return;
  }

  const mail = buildAlertEmail(m, {
    from: process.env.RESEND_FROM?.trim() || "Website enquiries <onboarding@resend.dev>",
    to,
    adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001",
  });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `enquiry-${m.id}`, // a retry never sends the same alert twice
      },
      body: JSON.stringify(mail),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Resend's error text says what's wrong (bad key, unverified sender…) — never includes the key
      console.error("Enquiry alert failed:", res.status, (await res.text()).slice(0, 300));
    }
  } catch (e) {
    console.error("Enquiry alert failed:", e instanceof Error ? e.message : e);
  }
}
