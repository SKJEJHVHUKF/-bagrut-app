import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ConsoleShell from '@/components/school/ConsoleShell';

// About real students, and per-teacher — never cache.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'קונסולת מורה — MathUp',
  robots: { index: false, follow: false },
};

/**
 * The teacher console's gate.
 *
 * It lives HERE and not per page for the same reason /admin's does: five
 * screens means five copies of the check, and the fifth is the one somebody
 * forgets. Authorisation for a specific CLASS still happens per request in
 * lib/school-guard — this only establishes that somebody is signed in.
 *
 * The chrome itself is ConsoleShell, shared with the ungated /console-demo.
 */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/console');

  const name =
    ((user.user_metadata?.name as string) || '').trim() || user.email?.split('@')[0] || 'מורה';

  return <ConsoleShell name={name}>{children}</ConsoleShell>;
}
