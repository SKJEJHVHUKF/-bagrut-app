'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
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
  HelpCircle,
} from 'lucide-react';
import MathUpLogo from '@/components/MathUpLogo';

/**
 * ConsoleShell — the teacher console's frame, in MathUp's own language.
 *
 * A glass rail with the class's five sections, a transparent page over the
 * app's ambient light, the brand's ink and display face. This is the sibling
 * of /teacher (the private-tutor board): same brand, different product — and
 * NOT the student app, whose chrome STAFF_PREFIXES (lib/nav.ts) keeps off
 * every /console route.
 *
 * The first version was a dark slate rail over slate panels: a generic
 * dashboard wearing none of the product's clothes. The owner called it cheap
 * four times. He was describing the absence of the brand, not the presence of
 * a rail.
 *
 * Shared by /console (gated) and /console-demo (open). MotionConfig honours
 * the OS reduced-motion setting for every animation under it.
 */

type ClassLite = { id: string; name: string };

const SECTIONS = [
  { seg: '', label: 'סקירה', icon: Gauge, hint: 'מי צריך אותך עכשיו' },
  { seg: 'students', label: 'תלמידים', icon: Users, hint: 'כל הכיתה, לפי מצב' },
  { seg: 'focus', label: 'תרגולים', icon: Target, hint: 'מה שלחת לתרגל, ומי סגר' },
  { seg: 'report', label: 'דוחות', icon: Printer, hint: 'להורים, לרכז, לתיק' },
  { seg: 'settings', label: 'הגדרות', icon: Settings, hint: 'שם, רמה, הצטרפות' },
] as const;

export default function ConsoleShell({
  name,
  demo = false,
  children,
}: {
  name?: string;
  demo?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const classMatch = /^\/console\/class\/([^/]+)(?:\/([^/]+))?/.exec(pathname);
  const demoMatch = /^\/console-demo(?:\/([^/]+))?/.exec(pathname);
  const classId = demo ? 'demo' : (classMatch?.[1] ?? null);
  const section = demo ? (demoMatch?.[1] ?? '') : (classMatch?.[2] ?? '');
  const onHelp = pathname.endsWith('/help');

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

  const current = demo ? { id: 'demo', name: 'י׳3 — כיתת דוגמה' } : (classes.find((c) => c.id === classId) ?? null);
  const base = demo ? '/console-demo' : classId ? `/console/class/${classId}` : null;
  const helpHref = demo ? '/console-demo/help' : '/console/help';

  const railLink = (active: boolean) =>
    `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold transition ${
      active
        ? 'bg-primary-container text-violet-900'
        : 'text-slate-600 hover:bg-slate-900/[0.04] hover:text-ink'
    }`;

  const sections = SECTIONS.filter((s) => !demo || s.seg !== 'settings');

  return (
    <MotionConfig reducedMotion="user">
      <div dir="rtl" className="min-h-screen text-slate-900" style={{ fontFamily: 'var(--font-heebo), sans-serif' }}>
        <div className="flex min-h-screen">
          {/* ---- rail ---------------------------------------------------- */}
          <aside className="glass-card hidden w-64 shrink-0 flex-col rounded-none border-y-0 border-s-0 lg:sticky lg:top-0 lg:flex lg:h-screen">
            <Link href={name ? '/console' : '/'} className="flex items-center gap-3 px-5 py-4">
              <MathUpLogo size="sm" />
              <span>
                <span className="font-display block text-sm leading-tight font-black text-ink">MathUp</span>
                <span className="block text-[10px] leading-tight text-slate-600">קונסולת מורה</span>
              </span>
            </Link>

            <nav className="flex flex-col gap-0.5 px-3" aria-label="ניווט הקונסולה">
              <Link href="/console" aria-current={pathname === '/console' ? 'page' : undefined} className={railLink(pathname === '/console')}>
                <LayoutGrid className="h-4 w-4" aria-hidden />
                הכיתות שלי
              </Link>
              <Link href="/console-demo" aria-current={demo && !section && !onHelp ? 'page' : undefined} className={railLink(demo && !section && !onHelp)}>
                <Eye className="h-4 w-4" aria-hidden />
                תצוגת דוגמה
              </Link>
              <Link href={helpHref} aria-current={onHelp ? 'page' : undefined} className={railLink(onHelp)}>
                <HelpCircle className="h-4 w-4" aria-hidden />
                עזרה
              </Link>
            </nav>

            {base && (
              <div className="mt-5 border-t border-slate-900/[0.06] pt-4">
                <div className="px-5">
                  <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">כיתה</p>
                  {demo || classes.length <= 1 ? (
                    <p className="font-display mt-1 truncate text-sm font-black text-ink">{current?.name ?? '…'}</p>
                  ) : (
                    <ClassSwitcher classes={classes} currentId={classId!} />
                  )}
                </div>
                <nav className="mt-2 flex flex-col gap-0.5 px-3" aria-label="מדורי הכיתה">
                  {sections.map((s) => {
                    const href = s.seg ? `${base}/${s.seg}` : base;
                    const active = !onHelp && section === s.seg;
                    return (
                      <Link key={s.seg} href={href} title={s.hint} aria-current={active ? 'page' : undefined} className={railLink(active)}>
                        <s.icon className="h-4 w-4" aria-hidden />
                        {s.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}

            <div className="mt-auto border-t border-slate-900/[0.06] px-5 py-4">
              {name ? (
                <>
                  <p className="truncate text-sm font-bold text-ink">{name}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                    <Link href="/" className="inline-flex items-center gap-1 hover:text-violet-700">
                      <BookOpen className="h-3.5 w-3.5" aria-hidden />
                      לאפליקציה
                    </Link>
                    {/* Sign-out lives inside the learner chrome, hidden here. */}
                    <form action="/auth/signout" method="post" className="ms-auto">
                      <button type="submit" className="inline-flex items-center gap-1 hover:text-violet-700">
                        <LogOut className="h-3.5 w-3.5" aria-hidden />
                        יציאה
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <Link href="/login?next=/console" className="text-sm font-bold text-violet-700 underline-offset-4 hover:underline">
                  כניסה למורים ←
                </Link>
              )}
            </div>
          </aside>

          {/* ---- page ---------------------------------------------------- */}
          <div className="min-w-0 flex-1">
            {/* Small screens: the rail becomes a strip with the same map. */}
            <div className="glass-card sticky top-0 z-40 flex items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-4 py-2.5 lg:hidden">
              <Link href={name ? '/console' : '/'} className="flex items-center gap-2">
                <MathUpLogo size="sm" />
                <span className="font-display text-sm font-black text-ink">קונסולת מורה</span>
              </Link>
              <nav className="flex items-center gap-1 overflow-x-auto" aria-label="ניווט">
                <Link href="/console" className="rounded-lg px-2 py-1 text-xs font-bold whitespace-nowrap text-slate-600">
                  הכיתות
                </Link>
                {base &&
                  sections.map((s) => (
                    <Link
                      key={s.seg}
                      href={s.seg ? `${base}/${s.seg}` : base}
                      className={`rounded-lg px-2 py-1 text-xs font-bold whitespace-nowrap ${
                        !onHelp && section === s.seg ? 'bg-primary-container text-violet-900' : 'text-slate-600'
                      }`}
                    >
                      {s.label}
                    </Link>
                  ))}
                <Link href={helpHref} className="rounded-lg px-2 py-1 text-xs font-bold whitespace-nowrap text-slate-600">
                  עזרה
                </Link>
              </nav>
            </div>

            {children}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

/** A native select, styled for the rail. The platform one is keyboard-correct,
 *  screen-reader-correct, and free. */
function ClassSwitcher({ classes, currentId }: { classes: ClassLite[]; currentId: string }) {
  return (
    <label className="relative mt-1 block">
      <select
        value={currentId}
        onChange={(e) => {
          window.location.assign(`/console/class/${e.target.value}`);
        }}
        aria-label="החלף כיתה"
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white/70 py-1.5 pe-8 ps-3 text-sm font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
      >
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
    </label>
  );
}
