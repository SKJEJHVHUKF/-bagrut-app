'use client';

/**
 * ClassInvite — "יש לך קוד כיתה מהמורה?", on the screen the student actually
 * opens.
 *
 * WHY THIS EXISTS, and it is the whole lesson: joining a class was reachable
 * only from a drawer menu entry. The owner opened his own app, looked for it,
 * and could not find it — which is exactly what thirty fifteen-year-olds will
 * do with a code their teacher just read out, except they will not report it,
 * they will just not join.
 *
 * So the invitation goes where the student already is, and it removes itself
 * the moment it is answered: once he is in a class this renders nothing at all.
 * A prompt that stays after it has been acted on is the thing people learn to
 * scroll past.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { School, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/** Remembered per browser so a student who is not in a class, and does not want
 *  to be, is asked once rather than every time he opens the app. */
const DISMISS_KEY = 'mathup-class-invite-dismissed';

export default function ClassInvite() {
  const [show, setShow] = useState(false);

  const check = useCallback(async () => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
      const {
        data: { user },
      } = await createClient().auth.getUser();
      // Nothing to invite a logged-out visitor to: he cannot join a class
      // without an account, and asking first would be a dead end.
      if (!user) return;

      const res = await fetch('/api/school/my-classes');
      const data = res.ok ? await res.json() : { classes: [] };
      setShow((data.classes ?? []).length === 0);
    } catch {
      // A student whose class lookup failed sees no banner rather than a
      // broken one. This is an invitation, not a feature.
    }
  }, []);

  useEffect(() => {
    // `check` is async, so its setState lands in a later microtask.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void check();
  }, [check]);

  if (!show) return null;

  return (
    <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5 dark:border-violet-900/70 dark:bg-violet-950/40">
      <School className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
      <p className="min-w-0 flex-1 text-sm leading-relaxed text-violet-900 dark:text-violet-200">
        <strong className="font-semibold">המורה שלך שלח קוד כיתה?</strong> הזן אותו פעם אחת, ומשם
        תראה בדיוק מה הוא ביקש שתתרגל.
      </p>
      <Link
        href="/my-class"
        className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
      >
        להזנת הקוד
      </Link>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(DISMISS_KEY, '1');
          } catch {
            // Private mode — it just comes back next time. Harmless.
          }
          setShow(false);
        }}
        aria-label="לא עכשיו"
        className="absolute top-2 left-2 rounded p-1 text-violet-400 transition hover:text-violet-700 dark:hover:text-violet-200"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
