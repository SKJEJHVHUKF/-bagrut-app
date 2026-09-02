'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  Target,
  Printer,
  Settings,
  Eye,
  LogOut,
  BookOpen,
  ChevronDown,
  Gauge,
} from 'lucide-react';
import MathUpLogo from '@/components/MathUpLogo';

/**
 * ConsoleShell — the teacher console's frame: a dark navigation rail, a
 * command bar, a quiet ground. Nothing from the student app.
 *
 * WHY IT IS DARK, AND WHY IT HAS SECTIONS
 * Three passes of "a lighter version of the student screens" were each judged
 * cheap, and the owner was right about the cause: a console is a different
 * product, not a friendlier skin. Teachers are not sixteen. They expect what a
 * school's other systems give them — a fixed rail that tells them where they
 * are, a class they can switch, sections for the jobs they actually do
 * (overview, roster, focus, reports, settings), and pages made of tables.
 *
 * The rail is the product's map. When a class is selected it lists that
 * class's five sections; above them, the way back to all classes and a way to
 * switch. Two items were not a map; they were a hint.
 *
 * Shared by /console (gated) and /console-demo (open). Both prefixes are in
 * STAFF_PREFIXES (lib/nav.ts), which removes the learner's chrome everywhere.
 */

type ClassLite = { id: string; name: string };

const SECTIONS = [
  { seg: '', label: 'סקירה', icon: Gauge, hint: 'מי צריך אותך עכשיו' },
  { seg: 'students', label: 'תלמידים', icon: Users, hint: 'הרשימה המלאה, ממוינת' },
  { seg: 'focus', label: 'מיקודים', icon: Target, hint: 'מה שלחת, ומי סגר' },
  { seg: 'report', label: 'דוחות', icon: Printer, hint: 'להורים, לרכז, לתיק' },
  { seg: 'settings', label: 'הגדרות', icon: Settings, hint: 'שם, רמה, הצטרפות' },
] as const;

export default function ConsoleShell({
  name,
  /** Sample mode: the rail shows one fixed "class" and no switcher. */
  demo = false,
  children,
}: {
  name?: string;
  demo?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const classMatch = /^\/console\/class\/([^/]+)(?:\/([^/]+))?/.exec(pathname);
  const classId = demo ? 'demo' : (classMatch?.[1] ?? null);
  const section = demo ? '' : (classMatch?.[2] ?? '');

  const [classes, setClasses] = useState<ClassLite[]>([]);
  const load = useCallback(async () => {
    if (demo || !name) return;
    try {
      const res = await fetch('/api/school/classes');
      if (!res.ok) return;
      const d = await res.json();
      setClasses((d.classes ?? []).map((c: ClassLite) => ({ id: c.id, name: c.name })));
    } catch {
      // The rail degrades to "הכיתות שלי" alone; the page still loads its own.
    }
  }, [demo, name]);
  useEffect(() => {
    // `load` is async; its setState lands in a later microtask.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const current = demo
    ? { id: 'demo', name: 'י׳3 — כיתת דוגמה' }
    : (classes.find((c) => c.id === classId) ?? null);
  const base = demo ? '/console-demo' : classId ? `/console/class/${classId}` : null;

  const railLink = (active: boolean) =>
    `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
      active
        ? 'bg-white/10 font-medium text-white'
        : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* ---- rail ------------------------------------------------------ */}
        <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 text-slate-200 lg:flex">
          <Link href={name ? '/console' : '/'} className="flex items-center gap-3 px-5 py-4">
            <MathUpLogo size="sm" />
            <span>
              <span className="block text-sm leading-tight font-bold text-white">MathUp</span>
              <span className="block text-[11px] leading-tight text-slate-400">קונסולת מורה</span>
            </span>
          </Link>

          <nav className="flex flex-col gap-0.5 px-3" aria-label="ניווט הקונסולה">
            <Link
              href="/console"
              aria-current={pathname === '/console' ? 'page' : undefined}
              className={railLink(pathname === '/console')}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              הכיתות שלי
            </Link>
            <Link
              href="/console-demo"
              aria-current={demo ? 'page' : undefined}
              className={railLink(demo)}
            >
              <Eye className="h-4 w-4" aria-hidden />
              תצוגת דוגמה
            </Link>
          </nav>

          {/* ---- the selected class and its sections --------------------- */}
          {base && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="px-5">
                <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  כיתה
                </p>
                {demo || classes.length <= 1 ? (
                  <p className="mt-1 truncate text-sm font-semibold text-white">
                    {current?.name ?? '…'}
                  </p>
                ) : (
                  <ClassSwitcher classes={classes} currentId={classId!} />
                )}
              </div>
              <nav className="mt-2 flex flex-col gap-0.5 px-3" aria-label="מדורי הכיתה">
                {SECTIONS.filter((s) => !demo || s.seg !== 'settings').map((s) => {
                  const href = s.seg ? `${base}/${s.seg}` : base;
                  const active = section === s.seg;
                  return (
                    <Link
                      key={s.seg}
                      href={href}
                      title={s.hint}
                      aria-current={active ? 'page' : undefined}
                      className={railLink(active)}
                    >
                      <s.icon className="h-4 w-4" aria-hidden />
                      {s.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          <div className="mt-auto border-t border-white/10 px-5 py-4">
            {name ? (
              <>
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <Link href="/" className="inline-flex items-center gap-1 hover:text-white">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                    לאפליקציה
                  </Link>
                  {/* Sign-out lives inside the learner chrome, hidden here. */}
                  <form action="/auth/signout" method="post" className="ms-auto">
                    <button type="submit" className="inline-flex items-center gap-1 hover:text-white">
                      <LogOut className="h-3.5 w-3.5" aria-hidden />
                      יציאה
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <Link
                href="/login?next=/console"
                className="text-sm font-medium text-white underline-offset-4 hover:underline"
              >
                כניסה למורים ←
              </Link>
            )}
          </div>
        </aside>

        {/* ---- page ------------------------------------------------------ */}
        <div className="min-w-0 flex-1">
          {/* Small screens: the rail becomes a strip with the same map. */}
          <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-2.5 text-slate-200 lg:hidden">
            <Link href={name ? '/console' : '/'} className="flex items-center gap-2">
              <MathUpLogo size="sm" />
              <span className="text-sm font-bold text-white">קונסולת מורה</span>
            </Link>
            <nav className="flex items-center gap-1 overflow-x-auto" aria-label="ניווט">
              <Link href="/console" className="rounded px-2 py-1 text-xs whitespace-nowrap hover:bg-white/10">
                הכיתות
              </Link>
              {base &&
                SECTIONS.filter((s) => !demo || s.seg !== 'settings').map((s) => (
                  <Link
                    key={s.seg}
                    href={s.seg ? `${base}/${s.seg}` : base}
                    className={`rounded px-2 py-1 text-xs whitespace-nowrap ${
                      section === s.seg ? 'bg-white/15 text-white' : 'hover:bg-white/10'
                    }`}
                  >
                    {s.label}
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

/** A native select, styled for the dark rail. No custom dropdown: the platform
 *  one is keyboard-correct, screen-reader-correct, and free. */
function ClassSwitcher({ classes, currentId }: { classes: ClassLite[]; currentId: string }) {
  return (
    <label className="relative mt-1 block">
      <select
        value={currentId}
        onChange={(e) => {
          window.location.assign(`/console/class/${e.target.value}`);
        }}
        aria-label="החלף כיתה"
        className="w-full appearance-none rounded-md border border-white/15 bg-white/5 py-1.5 pe-8 ps-3 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {classes.map((c) => (
          <option key={c.id} value={c.id} className="text-slate-900">
            {c.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
    </label>
  );
}
