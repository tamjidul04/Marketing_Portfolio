'use client';

import Link from 'next/link';
import { useActionState, useId, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { ImageField } from '@/components/forms/image-field';
import { readableOn } from '@/lib/format';
import type { Field, FormState, Social } from '@/lib/forms/types';

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
type Group = { title: string; blurb: string; fields: string[] };

const inputCls =
  'w-full min-h-12 rounded-xl border border-line bg-background px-3.5 text-base outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20 aria-[invalid=true]:border-red-400';

function Hint({ id, field, error }: { id: string; field: Field; error?: string }) {
  return (
    <>
      {error ? (
        <p id={`${id}-err`} className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : (
        field.help && (
          <p id={`${id}-help`} className="text-[13px] text-muted">
            {field.help}
          </p>
        )
      )}
    </>
  );
}

function SocialsEditor({ initial, error, id }: { initial: string; error?: string; id: string }) {
  const parse = (): Social[] => {
    try {
      const v = JSON.parse(initial);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };
  const [rows, setRows] = useState<Social[]>(() => {
    const r = parse();
    return r.length ? r : [{ platform: '', url: '' }];
  });
  const set = (i: number, key: keyof Social, v: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  return (
    <div className="grid gap-2" id={id}>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto] items-center gap-2">
          <input name="socials_platform" aria-label={`Social link ${i + 1} name`} value={r.platform} onChange={(e) => set(i, 'platform', e.target.value)} placeholder="instagram" className={inputCls} />
          <input name="socials_url" aria-label={`Social link ${i + 1} web address`} value={r.url} onChange={(e) => set(i, 'url', e.target.value)} placeholder="https://instagram.com/yourname" inputMode="url" className={inputCls} />
          <button type="button" onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : [{ platform: '', url: '' }]))} aria-label={`Remove link ${i + 1}`} className="grid size-11 place-items-center rounded-xl border border-line text-lg text-muted hover:border-red-300 hover:text-red-600">
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={() => setRows((rs) => [...rs, { platform: '', url: '' }])} className="w-fit rounded-xl border border-dashed border-line px-3 py-2 text-sm font-bold text-muted hover:border-accent hover:text-foreground">
        + Add another link
      </button>
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}

function PairsEditor({ field, initial, error, id }: { field: Field; initial: string; error?: string; id: string }) {
  const pair = field.pair!;
  type Row = { a: string; b: string };
  const [rows, setRows] = useState<Row[]>(() => {
    try {
      const v = JSON.parse(initial);
      if (Array.isArray(v) && v.length) return v as Row[];
    } catch {}
    return [{ a: '', b: '' }];
  });
  const set = (i: number, key: 'a' | 'b', v: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  const max = field.maxItems ?? 10;
  return (
    <div className="grid gap-2" id={id}>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)_auto] items-center gap-2">
          <input name={`${field.name}_a`} aria-label={`${pair.labels[0]} ${i + 1}`} value={r.a} onChange={(e) => set(i, 'a', e.target.value)} placeholder={pair.placeholders?.[0] ?? pair.labels[0]} maxLength={pair.maxLen[0] + 20} className={inputCls} />
          <input name={`${field.name}_b`} aria-label={`${pair.labels[1]} ${i + 1}`} value={r.b} onChange={(e) => set(i, 'b', e.target.value)} placeholder={pair.placeholders?.[1] ?? pair.labels[1]} maxLength={pair.maxLen[1] + 20} className={inputCls} />
          <button type="button" onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : [{ a: '', b: '' }]))} aria-label={`Remove row ${i + 1}`} className="grid size-11 place-items-center rounded-xl border border-line text-lg text-muted hover:border-red-300 hover:text-red-600">
            ×
          </button>
        </div>
      ))}
      {rows.length < max && (
        <button type="button" onClick={() => setRows((rs) => [...rs, { a: '', b: '' }])} className="w-fit rounded-xl border border-dashed border-line px-3 py-2 text-sm font-bold text-muted hover:border-accent hover:text-foreground">
          + Add a row
        </button>
      )}
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}

function Control({ field, value, error, onColor }: { field: Field; value: string; error?: string; onColor?: (name: string, v: string) => void }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : field.help ? `${id}-help` : undefined;
  const common = { id, name: field.name, 'aria-invalid': !!error, 'aria-describedby': describedBy } as const;

  if (field.type === 'image') return <ImageField field={field} value={value} error={error} />;

  if (field.type === 'checkbox') {
    return (
      <div className="flex items-start gap-3 py-1">
        <input {...common} type="checkbox" defaultChecked={value === 'on'} className="mt-1 size-5 shrink-0 accent-[var(--accent)]" />
        <div>
          <label htmlFor={id} className="text-[15px] font-semibold">
            {field.label}
          </label>
          <Hint id={id} field={field} error={error} />
        </div>
      </div>
    );
  }

  let control: React.ReactNode;
  if (field.type === 'socials') {
    control = <SocialsEditor initial={value} error={error} id={id} />;
  } else if (field.type === 'pairs') {
    control = <PairsEditor field={field} initial={value} error={error} id={id} />;
  } else if (field.type === 'numbers') {
    control = <textarea {...common} defaultValue={value} rows={2} placeholder={field.placeholder} className={`${inputCls} py-3`} />;
  } else if (field.type === 'textarea' || field.type === 'lines') {
    control = <textarea {...common} defaultValue={value} rows={field.rows ?? 4} placeholder={field.placeholder} maxLength={field.max ? field.max + 200 : undefined} className={`${inputCls} py-3`} />;
  } else if (field.type === 'select') {
    control = (
      <select {...common} defaultValue={value} className={inputCls}>
        {!field.required && <option value="">—</option>}
        {field.options!.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === 'color') {
    control = (
      <div className="flex items-center gap-3">
        <input {...common} type="color" defaultValue={/^#[0-9a-f]{6}$/i.test(value) ? value : '#10b981'} onChange={(e) => onColor?.(field.name, e.target.value)} className="size-12 cursor-pointer rounded-xl border border-line bg-background p-1" />
        <code className="text-sm text-muted">{value}</code>
      </div>
    );
  } else {
    const type = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text';
    const inputMode = field.type === 'number' ? 'decimal' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : undefined;
    control = <input {...common} type={type} inputMode={inputMode} defaultValue={value} placeholder={field.placeholder} maxLength={field.max ? field.max + 50 : undefined} autoComplete="off" className={inputCls} />;
  }

  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </label>
      {control}
      {field.type !== 'socials' && field.type !== 'pairs' && <Hint id={id} field={field} error={error} />}
      {(field.type === 'socials' || field.type === 'pairs') && field.help && !error && <p className="text-[13px] text-muted">{field.help}</p>}
    </div>
  );
}

/** A tiny picture of the website using the chosen colours, updating as you pick. */
function ThemePreview({ colors }: { colors: { primary: string; accent: string; highlight: string } }) {
  const onAccent = readableOn(colors.accent);
  return (
    <div className="overflow-hidden rounded-2xl border border-line" aria-label="Colour preview">
      <div className="px-5 py-4 text-white" style={{ background: colors.primary }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.accent }}>— Preview</p>
        <p className="mt-1 text-2xl font-extrabold">3.2x <span className="text-sm font-semibold text-white/70">average return</span></p>
        <p className="text-3xl font-extrabold" style={{ color: colors.highlight }}>12,000+</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 bg-card px-5 py-4">
        <span className="rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: colors.accent, color: onAccent }}>Book Free Consultation</span>
        <span className="text-sm font-bold" style={{ color: colors.accent }}>Link text</span>
        <span className="text-sm font-extrabold" style={{ textDecoration: `underline ${colors.highlight} 3px` }}>Underlined</span>
      </div>
    </div>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="min-h-12 rounded-xl bg-accent px-6 font-bold text-on-accent shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60">
      {pending ? 'Saving…' : label}
    </button>
  );
}

export function EntityForm({
  fields, initial, action, submitLabel, cancelHref, groups, themePreview, savedText,
}: {
  fields: Field[];
  initial: Record<string, string>;
  action: Action;
  submitLabel: string;
  cancelHref?: string;
  groups?: Group[];
  themePreview?: boolean;
  savedText?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, undefined);
  // After an error the server echoes what was typed, so a mistake never wipes the form.
  const values = state?.values ?? initial;
  const errors = state?.errors ?? {};
  const [live, setLive] = useState<Record<string, string>>({});
  // names other fields depend on (showIf) - their live value decides which fields are shown
  const watched = new Set(fields.flatMap((f) => (f.showIf ? [f.showIf.field] : [])));
  const current = (name: string) => live[name] ?? values[name] ?? '';
  const shown = (f: Field) => !f.showIf || f.showIf.in.includes(current(f.showIf.field));
  const color = (n: string, fallback: string) => live[n] ?? (/^#[0-9a-f]{6}$/i.test(values[n] ?? '') ? values[n] : fallback);

  const byName = new Map(fields.map((f) => [f.name, f]));
  const sections: { title?: string; blurb?: string; list: Field[] }[] = groups
    ? groups.map((g) => ({ title: g.title, blurb: g.blurb, list: g.fields.map((n) => byName.get(n)!).filter(Boolean) }))
    : [{ list: fields }];

  return (
    <div className="grid gap-5">
      {state?.ok && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Saved. {savedText ?? 'Changes appear on your website within about a minute.'}
        </div>
      )}
      {state?.error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {state.error}
        </div>
      )}
      {Object.keys(errors).length > 0 && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          Please fix the {Object.keys(errors).length === 1 ? 'highlighted field' : `${Object.keys(errors).length} highlighted fields`} below. Nothing you typed was lost.
        </div>
      )}

      <form key={state?.savedAt ?? 'form'} action={formAction} noValidate className="grid gap-5" onChange={(e) => {
        const t = e.target as unknown as HTMLInputElement;
        if (t.name?.startsWith('color_') || watched.has(t.name)) setLive((l) => ({ ...l, [t.name]: t.value }));
      }}>
        {sections.map((s, si) => (
          <section key={si} className="rounded-2xl border border-line bg-card p-5 sm:p-6">
            {s.title && (
              <header className="mb-4">
                <h2 className="text-lg font-extrabold">{s.title}</h2>
                {s.blurb && <p className="text-sm text-muted">{s.blurb}</p>}
              </header>
            )}
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              {s.list.filter(shown).map((f) => (
                <div key={f.name} className={f.half ? '' : 'sm:col-span-2'}>
                  <Control field={f} value={values[f.name] ?? ''} error={errors[f.name]} onColor={(n, v) => setLive((l) => ({ ...l, [n]: v }))} />
                </div>
              ))}
            </div>
            {themePreview && s.list.some((f) => f.name === 'color_accent') && (
              <div className="mt-5">
                <ThemePreview colors={{ primary: color('color_primary', '#1B2A4A'), accent: color('color_accent', '#10B981'), highlight: color('color_highlight', '#10B981') }} />
              </div>
            )}
          </section>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <Submit label={submitLabel} />
          {cancelHref && (
            <Link href={cancelHref} className="inline-flex min-h-12 items-center rounded-xl border border-line px-5 font-bold text-muted hover:text-foreground">
              Cancel
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
