import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Admin = { id: string; email: string };

/**
 * Data Access Layer: the ONE function every protected page and server action calls.
 *  - getUser() asks Supabase Auth directly (catches revoked/expired sessions)
 *  - is_admin() checks the admins table in the database
 * Signed in but not an admin → /not-authorized. Not signed in → /login.
 * cache() = runs once per request even if several components call it.
 */
export const requireAdmin = cache(async (): Promise<Admin> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || isAdmin !== true) redirect('/not-authorized');

  return { id: user.id, email: user.email ?? '' };
});
