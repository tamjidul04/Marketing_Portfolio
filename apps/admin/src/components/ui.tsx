'use client';

import { useId, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { PASSWORD_RULES } from '@/lib/password-policy';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-navy font-extrabold text-gold">A</span>
          <span className="text-lg font-extrabold">Portfolio Admin</span>
        </div>
        <div className="rounded-2xl border border-line bg-card p-6 shadow-[0_10px_30px_rgba(27,42,74,.08)] sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[15px] text-[color:var(--muted)]">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  const styles =
    kind === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles}`}>
      {children}
    </div>
  );
}

const inputCls =
  'w-full min-h-12 rounded-xl border border-line bg-background px-3.5 text-base outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20 aria-[invalid=true]:border-red-400';

export function Field({
  label, name, type = 'text', error, ...rest
}: { label: string; name: string; type?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">{label}</label>
      <input id={id} name={name} type={type} className={inputCls} aria-invalid={!!error} aria-describedby={error ? id + '-err' : undefined} {...rest} />
      {error && <p id={id + '-err'} className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function PasswordField({
  label, name, error, showRules = false, autoComplete = 'current-password', ...rest
}: { label: string; name: string; error?: string; showRules?: boolean; autoComplete?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState('');
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">{label}</label>
      <div className="relative">
        <input
          id={id} name={name} type={visible ? 'text' : 'password'} autoComplete={autoComplete}
          className={inputCls + ' pr-20'} aria-invalid={!!error} aria-describedby={error ? id + '-err' : undefined}
          value={value} onChange={(e) => setValue(e.target.value)} {...rest}
        />
        <button
          type="button" onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-1.5 right-1.5 rounded-lg px-3 text-sm font-bold text-[color:var(--muted)] hover:bg-line/60"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {showRules && (
        <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]" aria-label="Password requirements">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.id} className={ok ? 'text-emerald-700' : 'text-[color:var(--muted)]'}>
                <span aria-hidden>{ok ? '✓' : '○'}</span> {r.label}
                <span className="sr-only">{ok ? ' (met)' : ' (not met)'}</span>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p id={id + '-err'} className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function SubmitButton({ children, pendingText }: { children: ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit" disabled={pending}
      className="min-h-12 w-full rounded-xl bg-gold px-5 font-bold text-navy shadow-[0_8px_20px_rgba(224,165,38,.3)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  );
}
