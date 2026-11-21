// Central place for environment values, with clear errors if one is missing.
// NEXT_PUBLIC_* values are inlined at build time, so they must be referenced literally.

function required(name: string, value: string | undefined): string {
  if (!value || value.startsWith('PASTE-')) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to apps/admin/.env.local and fill it in.`);
  }
  return value;
}

export const SUPABASE_URL = required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Public URL of this admin app — used in password-reset email links. Change when you get a domain. */
export const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001').replace(/\/+$/, '');
