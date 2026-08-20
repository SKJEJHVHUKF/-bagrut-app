import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/access';
import AdminDashboard from './AdminDashboard';

// Per-user (and owner-only) — never cache.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'לוח בקרה — MathUp',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already bounces anonymous visitors; this is the admin gate.
  if (!user) redirect('/login?next=/admin');
  if (!isAdmin(user)) redirect('/');

  return <AdminDashboard selfId={user.id} />;
}
