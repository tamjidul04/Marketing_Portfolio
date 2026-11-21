'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { changePassword, requestPasswordReset, setNewPassword, signIn, type FormState } from '@/lib/actions/auth';
import { Alert, Field, PasswordField, SubmitButton } from '@/components/ui';

export function LoginForm() {
  const params = useSearchParams();
  const [state, action] = useActionState<FormState, FormData>(signIn, undefined);
  return (
    <form action={action} className="grid gap-4" noValidate>
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <input type="hidden" name="next" value={params.get('next') ?? '/'} />
      <Field label="Email" name="email" type="email" autoComplete="username" inputMode="email" required autoFocus />
      <PasswordField label="Password" name="password" required />
      <div className="-mt-1 text-right">
        <Link href="/forgot-password" className="text-sm font-bold text-[color:var(--muted)] underline-offset-4 hover:text-foreground hover:underline">
          Forgot password?
        </Link>
      </div>
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const params = useSearchParams();
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, undefined);
  const linkProblem = params.get('error') === 'link';
  return (
    <form action={action} className="grid gap-4" noValidate>
      {linkProblem && !state && (
        <Alert kind="error">That reset link is invalid or has expired. Request a new one below.</Alert>
      )}
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.success ? (
        <Alert kind="success">{state.success}</Alert>
      ) : (
        <>
          <Field label="Admin email" name="email" type="email" autoComplete="username" inputMode="email" required autoFocus error={state?.fieldErrors?.email} />
          <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
        </>
      )}
      <Link href="/login" className="text-center text-sm font-bold text-[color:var(--muted)] hover:text-foreground">← Back to sign in</Link>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(setNewPassword, undefined);
  return (
    <form action={action} className="grid gap-4" noValidate>
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <PasswordField label="New password" name="password" autoComplete="new-password" showRules required autoFocus error={state?.fieldErrors?.password} />
      <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" required error={state?.fieldErrors?.confirm} />
      <SubmitButton pendingText="Saving…">Save new password</SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePassword, undefined);
  return (
    // key resets the fields after a successful change
    <form key={state?.success ?? 'form'} action={action} className="grid gap-4" noValidate>
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.success && <Alert kind="success">{state.success}</Alert>}
      <PasswordField label="Current password" name="current" required error={state?.fieldErrors?.current} />
      <PasswordField label="New password" name="password" autoComplete="new-password" showRules required error={state?.fieldErrors?.password} />
      <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" required error={state?.fieldErrors?.confirm} />
      <SubmitButton pendingText="Updating…">Change password</SubmitButton>
    </form>
  );
}
