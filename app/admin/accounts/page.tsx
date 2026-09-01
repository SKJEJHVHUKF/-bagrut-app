import { createClient } from '@/lib/supabase/server';
import AdminDashboard from '../AdminDashboard';

// The gate lives in app/admin/layout.tsx — every screen in the area passes
// through it, so it is not repeated here.
export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The layout already redirected anyone without a session; this is only for
  // the id, which the table needs so the owner cannot delete himself.
  return <AdminDashboard selfId={user?.id ?? ''} />;
}
