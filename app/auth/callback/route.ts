/**
 * OAuth / email-confirmation callback.
 *
 * Supabase redirects users here after they click the email confirmation
 * link or complete an OAuth flow. We exchange the `code` query param for
 * a session and then send them on to their intended destination.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextRaw = searchParams.get('next') ?? '/quiz';
  // Only allow relative paths in `next` — block open-redirect attempts
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/quiz';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — bounce to login with an error param the form can read
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
