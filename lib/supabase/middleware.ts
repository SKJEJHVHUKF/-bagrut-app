/**
 * Edge middleware helper for Supabase auth.
 *
 * Responsibilities:
 *   1. Refresh the auth session on every request (so cookies don't expire)
 *   2. Enforce route protection: anonymous users hitting /quiz get redirected
 *      to /login (with a `?next=/quiz` param so we can bounce back after login)
 *
 * Public routes (no auth required):
 *   - /
 *   - /login
 *   - /signup
 *   - /auth/*
 *   - any static/_next/icon/manifest/sw
 *
 * Protected routes:
 *   - /quiz (and anything else we add later that isn't in the public list)
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/quiz', '/chat', '/history', '/practice', '/learn'];

const PUBLIC_PREFIXES = [
  '/login',
  '/signup',
  '/auth',
  '/icon',
  '/apple-icon',
  '/manifest',
  '/sw.js',
  '/_next',
];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isPublic(pathname: string) {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mirror cookie writes onto both the request (so downstream
          // handlers see fresh values) and the outgoing response.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient() and getUser().
  // A simple mistake (e.g. logging the request) can break session refresh
  // and cause users to be randomly logged out.
  //
  // Safety net: never let a Supabase outage (paused/deleted project, network
  // blip) hang the edge middleware and 504 the ENTIRE site. Cap the auth call
  // with a short timeout and, on any failure, degrade gracefully — let the
  // request through as anonymous so public pages still load and each page's
  // own client-side auth checks take over.
  let user: unknown = null;
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('supabase-timeout')), 2500)
    );
    const result = await Promise.race([supabase.auth.getUser(), timeout]);
    user = (result as { data: { user: unknown } }).data.user;
  } catch {
    // Supabase unreachable/slow — don't block the site.
    return response;
  }

  const { pathname } = request.nextUrl;

  // Anonymous user hitting a protected route → bounce to /login
  if (!user && isProtected(pathname) && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Logged-in user hitting /login or /signup → bounce them into the app
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get('next');
    url.pathname = next && next.startsWith('/') ? next : '/quiz';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
