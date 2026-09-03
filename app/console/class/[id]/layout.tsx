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
import { Printer, Download, Target } from 'lucide-react';
import { ClassProvider, useClass, type ClassPayload } from '@/components/console/ClassContext';
import StudentPanel from '@/components/school/StudentPanel';
import FocusDialog from '@/components/console/FocusDialog';
import { Btn } from '@/components/console/Panel';

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
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
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
      <main className="px-6 pb-16 pt-5 lg:px-8">{children}</main>
      <Overlays />
    </ClassProvider>
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
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3 lg:px-8 print:hidden dark:border-slate-800 dark:bg-slate-900">
      <nav className="flex items-center gap-2 text-sm" aria-label="מיקום">
        <Link href="/console" className="text-slate-500 hover:text-slate-900 dark:text-slate-400">
          הכיתות שלי
        </Link>
        <span className="text-slate-300" aria-hidden>
          /
        </span>
        <span className="font-semibold text-slate-900 dark:text-slate-50">{data.class.name}</span>
        <span className="text-slate-300" aria-hidden>
          /
        </span>
        <span className="text-slate-600 dark:text-slate-300">{label[section] ?? section}</span>
      </nav>

      {!isDemo && classId && (
        <div className="flex items-center gap-2">
          <a
            href={`/api/school/classes/${classId}/export`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <Download className="h-4 w-4" aria-hidden />
            אקסל
          </a>
          <Link
            href={`/console/class/${classId}/report`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
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
  const { openStudent, showStudent, focusFor, closeFocus, openFocus, classId, isDemo, board, reload } =
    useClass();
  return (
    <>
      {openStudent && (
        <StudentPanel
          student={openStudent}
          reportHref={
            isDemo || !classId ? null : `/console/class/${classId}/report?student=${openStudent.id}`
          }
          onClose={() => showStudent(null)}
          onFocus={
            isDemo
              ? null
              : () => {
                  openFocus({ studentId: openStudent.id, name: openStudent.name });
                  showStudent(null);
                }
          }
        />
      )}
      {focusFor !== null && classId && !isDemo && (
        <FocusDialog
          classId={classId}
          students={board.students}
          preselect={focusFor === 'class' ? null : focusFor.studentId}
          onClose={closeFocus}
          onSaved={() => {
            closeFocus();
            reload();
          }}
        />
      )}
    </>
  );
}
