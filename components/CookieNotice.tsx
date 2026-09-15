'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';

const KEY = 'cookie-notice-ack-v1';

function acked(): boolean {
  try {
    return Boolean(localStorage.getItem(KEY));
  } catch {
    return true; // storage blocked — don't nag on every page
  }
}

// Informational notice, not a consent gate: the site sets essential cookies
// only (see /cookies). If analytics/ads are ever added this must become a real
// opt-in that blocks them until accepted.
export default function CookieNotice() {
  // Server snapshot = true, so SSR renders nothing and there is no hydration flash.
  const stored = useSyncExternalStore(() => () => {}, acked, () => true);
  const [dismissed, setDismissed] = useState(false);

  if (stored || dismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {}
    setDismissed(true);
  }

  return (
    <div
      role="region"
      aria-label="הודעת עוגיות"
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4 md:inset-x-auto md:right-4 z-[60] flex items-center gap-3 rounded-full border border-slate-900/10 bg-white/95 backdrop-blur shadow-md pr-4 pl-1.5 py-1.5 text-xs text-slate-600"
    >
      <p className="flex-1">
        עוגיות חיוניות בלבד, בלי מעקב.{' '}
        <Link href="/cookies" className="text-violet-700 underline underline-offset-2">
          פרטים
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="min-h-[36px] px-4 rounded-full bg-slate-900/[0.06] hover:bg-slate-900/10 text-slate-800 font-bold"
      >
        הבנתי
      </button>
    </div>
  );
}
