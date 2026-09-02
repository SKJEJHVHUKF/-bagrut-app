'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Eye, LogOut, ArrowLeft, BookOpen } from 'lucide-react';
import MathUpLogo from '@/components/MathUpLogo';

/**
 * ConsoleShell — the teacher console's frame: a sidebar, a quiet ground, and
 * nothing from the student app.
 *
 * The first version was a single top bar over the same rounded, airy cards the
 * student sees, and the owner's verdict was that it felt cheap. He was right
 * about the cause: a console is not a friendlier version of the learner's
 * screens. Teachers are not sixteen. They want the thing a school's other
 * systems give them — a fixed navigation rail, a dense page with a header they
 * can find their way back from, tables over cards, and no decoration doing the
 * work that structure should do.
 *
 * Shared by /console (gated, a real teacher) and /console-demo (open, the link
 * you send a teacher before they have an account). A second copy of this frame
 * would drift within a week and the demo would stop looking like the product.
 *
 * ⚠️ Both prefixes are in STAFF_PREFIXES (lib/nav.ts) — the single list every
 * piece of learner chrome checks. That is what removes the top nav, the bottom
 * tab bar, the floating avatar and the tutor bubble here.
 */
export default function ConsoleShell({
  name,
  children,
}: {
  /** The signed-in teacher, when there is one. Absent on the public demo. */
  name?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';

  const nav = [
    { href: '/console', label: 'הכיתות שלי', icon: LayoutGrid, match: ['/console'] },
    { href: '/console-demo', label: 'תצוגת דוגמה', icon: Eye, match: ['/console-demo'] },
  ];

  const here = (m: string[]) =>
    m.some((p) => pathname === p || (p !== '/console' && pathname.startsWith(p + '/'))) ||
    (m.includes('/console') && pathname.startsWith('/console/'));

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* ---- rail ------------------------------------------------------ */}
        <aside className="hidden w-60 shrink-0 flex-col border-l border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
          <Link href={name ? '/console' : '/'} className="flex items-center gap-3 px-5 py-4">
            <MathUpLogo size="sm" />
            <span>
              <span className="block text-sm leading-tight font-bold text-slate-900 dark:text-slate-50">
                MathUp
              </span>
              <span className="block text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                קונסולת מורה
              </span>
            </span>
          </Link>

          <nav className="mt-2 flex flex-col gap-0.5 px-3" aria-label="ניווט הקונסולה">
            {nav.map((n) => {
              const active = here(n.match);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-slate-900 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <n.icon className="h-4 w-4" aria-hidden />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 px-5">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              איך זה עובד
            </p>
            <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <li>1. פותחים כיתה ומקבלים קוד</li>
              <li>2. התלמידים מזינים אותו באפליקציה</li>
              <li>3. הם מתרגלים כרגיל</li>
              <li>4. הלוח מראה מי צריך אותך</li>
            </ol>
          </div>

          <div className="mt-auto border-t border-slate-200 px-5 py-4 dark:border-slate-800">
            {name ? (
              <>
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                  {name}
                </p>
                <div className="mt-2 flex gap-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  >
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                    לאפליקציה
                  </Link>
                  {/* Sign-out lives inside the learner chrome, which is hidden
                      here; without this the only way out is to guess a URL. */}
                  <form action="/auth/signout" method="post" className="ms-auto">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-700 dark:text-slate-400"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden />
                      יציאה
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <Link
                href="/login?next=/console"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                כניסה למורים
              </Link>
            )}
          </div>
        </aside>

        {/* ---- page ------------------------------------------------------ */}
        <div className="min-w-0 flex-1">
          {/* Small screens: the rail becomes a top strip. A teacher on a phone
              in a corridor still gets the two destinations and the way out. */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 lg:hidden dark:border-slate-800 dark:bg-slate-900">
            <Link href={name ? '/console' : '/'} className="flex items-center gap-2">
              <MathUpLogo size="sm" />
              <span className="text-sm font-bold">קונסולת מורה</span>
            </Link>
            <nav className="flex items-center gap-1" aria-label="ניווט הקונסולה">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                    here(n.match)
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
