import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env';
import type { Database } from '@/lib/database.types';

/**
 * Supabase client for Server Components, Server Actions and Route Handlers (typed from the schema).
 * Create a new one per request — never share it between users.
 */
export async function createClient() {
  // Always render at request time. Next.js 16 pre-builds pages in the background for instant navigation,
  // and the Supabase login library reads the clock when it starts, which is not allowed during pre-building.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: proxy.ts refreshes the session on every request.
        }
      },
    },
  });
}
