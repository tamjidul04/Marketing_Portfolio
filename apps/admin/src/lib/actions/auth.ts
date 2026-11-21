'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { ADMIN_URL } from '@/lib/env';
import { passwordProblems } from '@/lib/password-policy';
import { safeNextPath } from '@/lib/safe-redirect';

export type FormState = { error?: string; success?: string; fieldErrors?: Record<string, string> } | undefined;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const str = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();

/* ------------------------------------------------------------------ */
/*  Sign in                                                            */
/* ------------------------------------------------------------------ */
export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, 'email').toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = safeNextPath(formData.get('next'));

  if (!EMAIL_RE.test(email) || !password) {
    return { error: 'Enter your email and password.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.status === 429) return { error: 'Too many attempts. Please wait a few minutes and try again.' };
    // Same message for "no such user" and "wrong password" — don't reveal which emails exist.
    return { error: 'Incorrect email or password.' };
  }

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access." };
  }

  redirect(next);
}

/* ------------------------------------------------------------------ */
/*  Forgot password → email with a reset link                         */
/* ------------------------------------------------------------------ */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, 'email').toLowerCase();
  if (!EMAIL_RE.test(email)) return { fieldErrors: { email: 'Enter a valid email address.' } };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${ADMIN_URL}/auth/confirm?next=/reset-password`,
  });

  if (error?.status === 429) {
    return { error: 'Too many reset requests. Please wait a few minutes and try again.' };
  }
  // Always the same answer, whether or not the email has an account.
  return {
    success: "If that email belongs to an admin account, a reset link is on its way. Check your inbox (and spam folder). The link works once and expires in 1 hour.",
  };
}

/* ------------------------------------------------------------------ */
/*  Set a new password after clicking the email link                  */
/* ------------------------------------------------------------------ */
export async function setNewPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin(); // the reset link signed the user in; still must be an admin

  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  const problems = passwordProblems(password);
  if (problems.length) return { fieldErrors: { password: 'Password needs: ' + problems.join(', ').toLowerCase() + '.' } };
  if (password !== confirm) return { fieldErrors: { confirm: "Passwords don't match." } };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendlyPasswordError(error.message) };

  redirect('/?notice=password-updated');
}

/* ------------------------------------------------------------------ */
/*  Change password while signed in (Settings)                        */
/* ------------------------------------------------------------------ */
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const current = String(formData.get('current') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!current) return { fieldErrors: { current: 'Enter your current password.' } };
  const problems = passwordProblems(password);
  if (problems.length) return { fieldErrors: { password: 'Password needs: ' + problems.join(', ').toLowerCase() + '.' } };
  if (password !== confirm) return { fieldErrors: { confirm: "Passwords don't match." } };
  if (password === current) return { fieldErrors: { password: 'Choose a password different from your current one.' } };

  const supabase = await createClient();

  // Re-check the current password (also counts as a "recent login" for Supabase's secure password change).
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: admin.email, password: current });
  if (verifyError) {
    if (verifyError.status === 429) return { error: 'Too many attempts. Please wait a few minutes and try again.' };
    return { fieldErrors: { current: 'Current password is incorrect.' } };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendlyPasswordError(error.message) };

  return { success: 'Password changed. Use the new password next time you sign in.' };
}

/* ------------------------------------------------------------------ */
/*  Sign out                                                           */
/* ------------------------------------------------------------------ */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

function friendlyPasswordError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('same') || m.includes('different')) return 'Choose a password different from your current one.';
  if (m.includes('weak') || m.includes('characters')) return 'That password is too weak. Use at least 10 characters with upper and lower case letters and a number.';
  if (m.includes('reauthentication') || m.includes('recent')) return 'For security, please sign in again and then change your password.';
  return 'Could not update the password. Please try again.';
}
