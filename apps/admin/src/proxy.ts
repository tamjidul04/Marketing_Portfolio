import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Runs before every admin page:
 *  1. refreshes the Supabase session cookie (keeps the admin logged in)
 *  2. optimistic gate: not signed in → /login
 *
 * This is only the first lock. Every page and action ALSO checks the user is an
 * admin on the server (lib/auth.ts), and the database enforces it again with RLS.
 */

// Pages reachable without being signed in
const PUBLIC_PATHS = ['/login', '/forgot-password', '/auth/confirm'];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // getClaims() verifies the JWT signature — never trust an unverified session here.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));

  if (!signedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = path === '/' ? '' : `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return withCookies(NextResponse.redirect(url), response);
  }

  if (signedIn && (path === '/login' || path === '/forgot-password')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return withCookies(NextResponse.redirect(url), response);
  }

  return response;
}

// Keep any refreshed session cookies when we redirect.
function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((c) => target.cookies.set(c));
  return target;
}

export const config = {
  matcher: [
    // everything except static files and images
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
