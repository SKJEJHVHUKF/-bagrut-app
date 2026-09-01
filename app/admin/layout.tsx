import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import MathUpLogo from '@/components/MathUpLogo';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, isTeacher } from '@/lib/access';
import AdminNav from './AdminNav';

// Owner-only, and about real people — never cache.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ניהול — MathUp',
  robots: { index: false, follow: false },
};

/**
 * The admin area's shell — chrome and, more importantly, the gate.
 *
 * Every screen under /admin is protected HERE rather than page by page. The
 * old console was a single page that checked isAdmin() itself; splitting it
 * into five screens would have meant five copies of that check, and the fifth
 * one is the one somebody forgets.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');
  // A teacher given the wrong URL is sent to his own board, not dumped into the
  // student app with no explanation — he is staff, just not the owner.
  if (!isAdmin(user)) redirect(isTeacher(user) ? '/teacher' : '/');

  return (
    <div
      className="min-h-screen text-slate-900 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]"
        />
      </div>

      <header className="sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <MathUpLogo size="md" />
            <div>
              <div className="text-base font-black font-display text-slate-800">MathUp</div>
              <div className="text-[10px] text-slate-600 -mt-0.5">ניהול</div>
            </div>
          </Link>
        <div className="flex items-center gap-2">
          {/* The learner's chrome is hidden on staff screens, and the sign-out
              button lived inside it — without this, the only way off this
              screen is to leave the staff area first. */}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 bg-slate-900/[0.03] hover:bg-red-500/10 border border-slate-900/10 hover:border-red-500/30 text-slate-600 hover:text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>התנתקות</span>
            </button>
          </form>
          <Link
            href="/"
            className="group flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            <span>לאפליקציה</span>
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        <AdminNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
