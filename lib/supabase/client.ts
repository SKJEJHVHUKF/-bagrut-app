/**
 * Supabase client for Client Components ('use client' files).
 * Use this in any component that needs to read auth state, sign users in/out, etc.
 * from the browser.
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
