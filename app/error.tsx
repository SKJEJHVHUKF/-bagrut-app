'use client';

/**
 * Route-segment error boundary — what a student sees when a page throws.
 *
 * Until 2026-09-03 there was none, so a render crash anywhere under the root
 * layout showed Next's default English "Application error" screen, and nobody
 * heard about it unless the student wrote to Itay. This page does two things:
 * says it in Hebrew with a way out, and reports the crash (message, stack,
 * digest, path) to /api/client-error so it lands in `public.client_errors`.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefreshCw, Map, LayoutDashboard } from 'lucide-react';
import { reportClientError } from '@/lib/report-client-error';
import { isStaffPath } from '@/lib/nav';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // This boundary is app-wide, so it also catches /teacher, /admin and
  // /console — three different people (private tutor, Itay, school teacher).
  // Send each back to the area he was already in: a single "/teacher" would
  // bounce Itay to /admin and drop a school teacher into the student app.
  const pathname = usePathname() ?? '';
  const staff = isStaffPath(pathname);
  const back = pathname.startsWith('/admin')
    ? '/admin'
    : pathname.startsWith('/console')
      ? '/console'
      : pathname.startsWith('/teacher')
        ? '/teacher'
        : '/roadmap';

  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 text-slate-800"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <main className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-black">משהו השתבש בדף הזה</h1>
          <p className="text-slate-600 leading-relaxed">
            {staff
              ? 'הנתונים לא נפגעו. נסה לטעון שוב, ואם זה חוזר, חזור למסך הראשי.'
              : 'התקדמות הלמידה שלך שמורה. נסה לטעון שוב, ואם זה חוזר, חזור למסלול ותמשיך משם.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white"
          >
            <RefreshCw className="w-4 h-4" />
            נסה שוב
          </button>
          {staff ? (
            <Link
              href={back}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold border border-slate-200 bg-white hover:bg-slate-50"
            >
              <LayoutDashboard className="w-4 h-4" />
              למסך הראשי
            </Link>
          ) : (
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold border border-slate-200 bg-white hover:bg-slate-50"
            >
              <Map className="w-4 h-4" />
              למסלול הלמידה
            </Link>
          )}
        </div>
        {error.digest ? (
          <p className="text-xs text-slate-400" dir="ltr">
            {error.digest}
          </p>
        ) : null}
      </main>
    </div>
  );
}
