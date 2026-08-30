import Link from 'next/link';
import { Home, Map } from 'lucide-react';
import MathUpLogo from '@/components/MathUpLogo';
import StaleDeployHeal from './StaleDeployHeal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'הדף לא נמצא — MathUp',
  robots: { index: false, follow: false },
};

/**
 * The 404 page — and the self-heal for the 404 that is NOT a 404.
 *
 * ============================================================
 * WHY THIS FILE EXISTS
 * ============================================================
 * Itay, mid-session: "עכשיו שאני נכנס לחדר בקרה שלי אני מקבל שגיאת 404".
 *
 * `/admin` was fine. Checked live while he was looking at the error:
 *
 *   GET https://bagrut-app.vercel.app/admin  →  307  /login?next=%2Fadmin
 *
 * The route existed, the build had it (`ƒ /admin`), and nothing in the code
 * returns `notFound()` on that path — the guard is a `redirect`.
 *
 * What actually happened is the Next.js App Router's oldest sharp edge. Five
 * deployments went out in the hour he was using the app. His tab was holding
 * the build manifest from the deployment it loaded with, and a CLIENT-SIDE
 * navigation asks for a route chunk by a hashed name that no longer exists on
 * the server. The fetch 404s, and the router renders this page — for a route
 * that is perfectly healthy. A hard refresh always fixed it, which is exactly
 * why it looked random.
 *
 * Two things were wrong and both are fixed here:
 *   · there was no `not-found.tsx` at all, so the app served Next's default
 *     English page to a Hebrew RTL product
 *   · nothing recovered from the stale-manifest case, so a student who hit it
 *     had no way to know that reloading would work
 */
export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 text-slate-800"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <StaleDeployHeal />
      <main className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <MathUpLogo className="h-14 w-14" />
        </div>
        <div className="space-y-2">
          <p className="font-display text-6xl font-black text-violet-600">404</p>
          <h1 className="font-display text-2xl font-black">הדף הזה לא נמצא</h1>
          <p className="text-slate-600 leading-relaxed">
            יכול להיות שהקישור ישן, או שהדף עבר מקום. הכול עדיין כאן — רק בכתובת אחרת.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
          >
            <Map className="h-4 w-4" aria-hidden />
            חזרה למסלול הלמידה
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <Home className="h-4 w-4" aria-hidden />
            לדף הבית
          </Link>
        </div>
      </main>
    </div>
  );
}
