'use client';

/**
 * /console/class/[id] — fetch the class ONCE, host it for every section.
 *
 * The five sections underneath (סקירה, תלמידים, מיקודים, דוחות, הגדרות) are
 * views of one payload. This layout fetches it, hands it to ClassProvider, and
 * renders the two overlays every section can open — the student drawer and the
 * focus dialog — so "מקד" is the same action everywhere.
 *
 * It also draws the command bar: breadcrumb on the right, the page's actions on
 * the left. Sections set their own title through <PageHeader/>.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Printer, Download, Target } from 'lucide-react';
import { ClassProvider, useClass, type ClassPayload } from '@/components/console/ClassContext';
import FocusDialog from '@/components/console/FocusDialog';
import { Btn, btnSecondary } from '@/components/console/ui';

export default function ClassLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<ClassPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/school/classes/${id}`);
      if (res.status === 403) {
        setError('אין לך גישה לכיתה הזו');
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
      setError(null);
    } catch {
      setError('לא הצלחנו לטעון את הכיתה. נסה לרענן.');
    }
  }, [id]);

  useEffect(() => {
    // `load` is async; its setState lands in a later microtask.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (error) {
    return (
      <main className="px-6 py-8">
        <p
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {error}
        </p>
        <Link href="/console" className="mt-4 inline-block text-sm underline underline-offset-4">
          חזרה לכיתות
        </Link>
      </main>
    );
  }
  if (!data) return <main className="px-6 py-8 text-sm text-slate-500">טוען…</main>;

  return (
    <ClassProvider data={data} reload={load}>
      <CommandBar />
      <EmptyClassNotice />
      <main className="px-6 pb-16 pt-6 lg:px-8">{children}</main>
      <Overlays />
    </ClassProvider>
  );
}

/**
 * A REAL class with nobody in it yet shows the sample board — a teacher's first
 * visit is always to an empty class, and "עוד אף תלמיד לא הצטרף" teaches him
 * nothing about why he should hand this to thirty students. But eight
 * invented names with no explanation is worse. This says what he is looking
 * at, and gives the one thing that turns it real. The demo route has its own
 * banner; this one is for the teacher's own class.
 */
function EmptyClassNotice() {
  const { isDemo, data } = useClass();
  if (!isDemo) return null;
  return (
    <div className="mx-6 mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm lg:mx-8 print:hidden">
      <span className="chip-primary rounded-full px-2.5 py-0.5 text-xs font-bold">תצוגת דוגמה</span>
      <p className="min-w-0 flex-1 leading-relaxed text-violet-950">
        <strong className="font-bold">הכיתה ריקה עדיין.</strong> התלמידים שמוצגים כאן מומצאים — כך ייראה
        הלוח כשהתלמידים שלך יתחילו לתרגל.
        {data.class.joinCode && (
          <>
            {' '}
            שלח להם את הקוד{' '}
            <span className="font-mono font-black tracking-widest text-ink">{data.class.joinCode}</span> והנתונים
            האמיתיים יחליפו אותה.
          </>
        )}
      </p>
      <Link href="/console" className="text-xs font-bold text-violet-700 underline-offset-4 hover:underline">
        להודעה המוכנה לכיתה ←
      </Link>
    </div>
  );
}

/** Breadcrumb + the actions that belong to the whole class. Hidden on print —
 *  a report with a toolbar on it is a report nobody tested on paper. */
function CommandBar() {
  const { data, classId, isDemo, openFocus } = useClass();
  const pathname = usePathname() ?? '';
  const section = pathname.split('/')[4] ?? '';
  const label: Record<string, string> = {
    '': 'סקירה',
    students: 'תלמידים',
    focus: 'תרגולים',
    report: 'דוחות',
    settings: 'הגדרות',
    student: 'תלמיד',
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 bg-white/50 px-6 py-3 lg:px-8 print:hidden">
      <nav className="flex items-center gap-2 text-sm" aria-label="מיקום">
        <Link href="/console" className="text-slate-600 hover:text-violet-700">
          הכיתות שלי
        </Link>
        <span className="text-slate-300" aria-hidden>
          /
        </span>
        <span className="font-display font-black text-ink">{data.class.name}</span>
        <span className="text-slate-300" aria-hidden>
          /
        </span>
        <span className="text-slate-600">{label[section] ?? section}</span>
      </nav>

      {!isDemo && classId && (
        <div className="flex items-center gap-2">
          <a href={`/api/school/classes/${classId}/export`} className={btnSecondary}>
            <Download className="h-4 w-4" aria-hidden />
            אקסל
          </a>
          <Link href={`/console/class/${classId}/report`} className={btnSecondary}>
            <Printer className="h-4 w-4" aria-hidden />
            דוח
          </Link>
          <Btn kind="primary" onClick={() => openFocus('class')}>
            <Target className="h-4 w-4" aria-hidden />
            שלח תרגול
          </Btn>
        </div>
      )}
    </div>
  );
}

function Overlays() {
  const {
    focusFor,
    focusTopic,
    focusPreselect,
    focusPreselectLabel,
    closeFocus,
    classId,
    isDemo,
    board,
    reload,
  } = useClass();
  return (
    <AnimatePresence>
      {focusFor !== null && classId && !isDemo && (
        <FocusDialog
          key="send"
          classId={classId}
          students={board.students}
          preselect={focusPreselect}
          preselectLabel={focusPreselectLabel}
          presetTopic={focusTopic}
          onClose={closeFocus}
          onSaved={() => {
            closeFocus();
            reload();
          }}
        />
      )}
    </AnimatePresence>
  );
}
