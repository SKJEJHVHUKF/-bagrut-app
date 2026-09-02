import Link from 'next/link';
import { ArrowLeft, LogOut } from 'lucide-react';
import MathUpLogo from '@/components/MathUpLogo';

/**
 * The teacher console's chrome — header, ground, and nothing from the student
 * app.
 *
 * Shared by two routes that differ ONLY in whether they are gated: /console
 * (signed in, a real teacher's classes) and /console-demo (open to anyone, the
 * link you send a teacher before they have an account). A second copy of this
 * header would drift, and the demo would slowly stop looking like the product
 * it is demonstrating.
 *
 * ⚠️ Both prefixes are in STAFF_PREFIXES (lib/nav.ts), which is the single list
 * every piece of learner chrome checks. That is what removes the top nav, the
 * bottom tab bar, the floating avatar and the tutor bubble — a teacher reading
 * his class's results should not be looking at "בוחן מהיר".
 */
export default function ConsoleShell({
  name,
  children,
}: {
  /** The signed-in teacher, when there is one. Absent on the public demo. */
  name?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
          <Link href={name ? '/console' : '/'} className="flex items-center gap-2.5">
            <MathUpLogo size="sm" />
            <span>
              <span className="block text-sm leading-tight font-bold text-slate-900 dark:text-slate-50">
                MathUp
              </span>
              <span className="block text-[11px] leading-tight text-violet-700 dark:text-violet-400">
                קונסולת מורה
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {name && (
              <span className="hidden text-sm text-slate-500 sm:inline dark:text-slate-400">
                {name}
              </span>
            )}
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300"
            >
              לאפליקציה
              <ArrowLeft
                className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
                aria-hidden
              />
            </Link>
            {/* The learner's chrome is hidden here, and sign-out lived inside
                it. Without this the only way out of the console is to guess a
                URL — the same trap /admin had to fix. */}
            {name && (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-slate-700 dark:text-slate-300"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  יציאה
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
