// Pure validation (no imports) so it can be unit-tested. Mirrors the database constraints —
// the database enforces them again, this just gives friendly errors before the round trip.

export type ContactInput = {
  name: string;
  business: string;
  phone: string;
  email: string;
  service: string;
  budget: string;
  message: string;
};
export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+?[0-9 ()-]{6,20}$/;

export function validateContact(raw: Record<string, string | undefined>): { ok: true; data: ContactInput } | { ok: false; errors: FieldErrors } {
  const v = (k: keyof ContactInput) => (raw[k] ?? "").replace(/\u0000/g, "").trim();
  const data: ContactInput = {
    name: v("name"), business: v("business"), phone: v("phone"), email: v("email"),
    service: v("service"), budget: v("budget"), message: v("message"),
  };
  const errors: FieldErrors = {};

  if (!data.name) errors.name = "Please enter your name.";
  else if (data.name.length > 100) errors.name = "That name is too long.";

  if (data.email && (!EMAIL_RE.test(data.email) || data.email.length > 254)) errors.email = "Enter a valid email address.";
  if (data.phone && !PHONE_RE.test(data.phone)) errors.phone = "Use digits only, e.g. +1 555 000 0000.";
  if (!data.phone && !data.email) errors.phone = "Add a phone / WhatsApp number or an email so I can reach you.";

  if (data.business.length > 120) errors.business = "That is too long (120 characters max).";
  if (data.service.length > 80) errors.service = "Choose a service from the list.";
  if (data.budget.length > 60) errors.budget = "Choose a budget from the list.";
  if (data.message.length > 5000) errors.message = "Please keep your message under 5,000 characters.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

/** A submitted form is treated as a bot if the hidden honeypot is filled or it was sent implausibly fast. */
export function looksLikeBot(honeypot: string | undefined, startedAt: string | undefined, now: number): boolean {
  if (honeypot && honeypot.trim() !== "") return true;
  const t = Number(startedAt);
  return Number.isFinite(t) && t > 0 && now - t < 2500;
}
