"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { sendEnquiryAlert } from "@/lib/notify";
import { createPublicClient } from "@/lib/supabase";
import { looksLikeBot, validateContact, type FieldErrors } from "@/lib/contact-schema";

// `values` echoes what the visitor typed: React 19 clears uncontrolled forms after an action,
// so without this a typo would wipe the whole form.
export type ContactState = { ok?: true; error?: string; fieldErrors?: FieldErrors; values?: Record<string, string> } | undefined;

/**
 * Consultation form → public.submit_contact_message() (validated + rate-limited in the database).
 * The visitor's IP is never stored — only a salted SHA-256 hash, used for rate-limiting.
 */
export async function submitConsultation(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const values = Object.fromEntries(["name", "business", "phone", "email", "service", "budget", "message"].map((k) => [k, (raw[k] ?? "").slice(0, 5100)]));

  // Bots: pretend it worked so they don't adapt.
  if (looksLikeBot(raw.website, raw.started, Date.now())) return { ok: true };

  const result = validateContact(raw);
  if (!result.ok) return { fieldErrors: result.errors, values };
  const d = result.data;

  const h = await headers();
  // x-real-ip is set by the host (e.g. Vercel) and can't be faked by the visitor; x-forwarded-for is the fallback
  const ip = h.get("x-real-ip") || (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = createHash("sha256").update(`${process.env.CONTACT_HASH_SALT ?? "portfolio"}:${ip}`).digest("hex");

  const path = typeof raw.path === "string" && raw.path.startsWith("/") ? raw.path.slice(0, 300) : undefined;

  const { data: id, error } = await createPublicClient().rpc("submit_contact_message", {
    p_name: d.name,
    p_email: d.email || undefined,
    p_phone: d.phone || undefined,
    p_business: d.business || undefined,
    p_service: d.service || undefined,
    p_budget: d.budget || undefined,
    p_message: d.message,
    p_source_path: path,
    p_ip_hash: ipHash,
  });

  if (error) {
    if (error.code === "P0429") return { error: "Too many messages right now. Please try again in a little while, or message me on WhatsApp.", values };
    console.error("submit_contact_message failed:", error.code, error.message);
    return { error: "Sorry, something went wrong and your message wasn't sent. Please try again or contact me directly.", values };
  }
  // Email alert, sent after the reply so the visitor never waits. The database rate limits ran first,
  // so the form can't be used to flood the owner's mailbox.
  if (typeof id === "string") {
    after(() =>
      sendEnquiryAlert({ id, name: d.name, business: d.business, email: d.email, phone: d.phone, service: d.service, budget: d.budget, message: d.message, sourcePath: path }),
    );
  }
  return { ok: true };
}
