"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { usePathname } from "next/navigation";
import { submitConsultation, type ContactState } from "@/lib/actions/contact";
import { SubmitButton } from "@/components/submit-button";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

function Field({ label, error, children }: { label: string; error?: string; children: (p: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : undefined })}
      {error && (
        <p className="field-err" id={`${id}-err`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function ConsultationForm({ services, budgets, responseText }: { services: string[]; budgets: string[]; responseText: string }) {
  const [state, action] = useActionState<ContactState, FormData>(submitConsultation, undefined);
  const path = usePathname();
  const startedRef = useRef<HTMLInputElement>(null); // when the form appeared — used to spot bots that submit instantly
  const fe = state?.fieldErrors ?? {};
  const val = state?.values ?? {};

  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);

  // Conversion events for Meta Pixel / Google Analytics (no-ops if tracking isn't configured).
  useEffect(() => {
    if (!state?.ok) return;
    try {
      window.fbq?.("track", "Lead");
      window.gtag?.("event", "generate_lead");
    } catch {}
  }, [state?.ok]);

  if (state?.ok) {
    return (
      <div className="form-ok" role="status">
        <div className="big" aria-hidden>
          ✓
        </div>
        <h3>Thank you!</h3>
        <p>Your request was received. {responseText}.</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="cform">
      <h3>Book a free consultation</h3>
      {state?.error && (
        <p className="form-err" role="alert">
          {state.error}
        </p>
      )}

      {/* Honeypot: invisible to people, tempting to bots */}
      <div className="hp" aria-hidden>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input ref={startedRef} type="hidden" name="started" defaultValue="" />
      <input type="hidden" name="path" value={path} />

      <div className="f2c">
        <Field label="Your name *" error={fe.name}>
          {(p) => <input {...p} name="name" defaultValue={val.name} required maxLength={100} autoComplete="name" placeholder="Full name" />}
        </Field>
        <Field label="Business name" error={fe.business}>
          {(p) => <input {...p} name="business" defaultValue={val.business} maxLength={120} autoComplete="organization" placeholder="Company / brand" />}
        </Field>
      </div>
      <div className="f2c">
        <Field label="Phone / WhatsApp" error={fe.phone}>
          {(p) => <input {...p} name="phone" defaultValue={val.phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="+1 555 000 0000" />}
        </Field>
        <Field label="Email" error={fe.email}>
          {(p) => <input {...p} name="email" defaultValue={val.email} type="email" inputMode="email" autoComplete="email" placeholder="you@business.com" />}
        </Field>
      </div>
      <div className="f2c">
        <Field label="Service" error={fe.service}>
          {(p) => (
            <select {...p} name="service" defaultValue={val.service ?? ""}>
              <option value="">Select…</option>
              {services.map((s) => (
                <option key={s}>{s}</option>
              ))}
              <option>Not sure yet</option>
            </select>
          )}
        </Field>
        <Field label="Monthly budget" error={fe.budget}>
          {(p) => (
            <select {...p} name="budget" defaultValue={val.budget ?? ""}>
              <option value="">Select…</option>
              {budgets.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <Field label="Tell me about your business & goals" error={fe.message}>
        {(p) => <textarea {...p} name="message" defaultValue={val.message} rows={4} maxLength={5000} placeholder="What do you sell, and what would you like to achieve?" />}
      </Field>

      <SubmitButton pendingText="Sending…">Send &amp; book my free call →</SubmitButton>
      <p className="form-note">🔒 Your details stay private. {responseText}.</p>
    </form>
  );
}
