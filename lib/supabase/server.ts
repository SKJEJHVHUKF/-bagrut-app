/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Reads/writes the session cookie via Next.js `cookies()`.
 *
 * NOTE: This must be an `async` factory because `cookies()` is async in
 * Next.js 15+ App Router.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `set` was called from a Server Component — safe to ignore here;
            // session refresh happens in middleware instead.
          }
        },
      },
    }
  );
}
