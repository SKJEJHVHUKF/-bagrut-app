'use client';

/**
 * /console-demo — the console with a sample class, and no account needed.
 *
 * What you send a teacher before they have an account: "open this link" is a
 * very different ask from "sign up, open a class, recruit thirty students,
 * then judge". It is the SAME shell, provider and section pages as a real
 * class — the sections under here re-export the real ones — fed by
 * lib/demo-board, so the demo cannot show something the product does not do.
 *
 * A demo that only showed the overview undersold the product and 404'd on the
 * rail's other four links; this layout is why it no longer does.
 */

import ConsoleShell from '@/components/school/ConsoleShell';
import { ClassProvider, useClass, type ClassPayload } from '@/components/console/ClassContext';
import StudentPanel from '@/components/school/StudentPanel';

const DEMO: ClassPayload = {
  class: {
    id: 'demo',
    name: 'י׳3 — כיתת דוגמה',
    school: null,
    units: 5,
    schoolYear: 'תשפ״ז',
    joinCode: null,
    archived: false,
  },
  // studentCount 0 is what puts the provider into sample mode.
  board: {
    studentCount: 0,
    activeThisWeek: 0,
    neverStarted: 0,
    needsAttention: [],
    reteach: [],
    students: [],
    topics: [],
  },
  focuses: [],
  windowDays: 120,
};

export default function ConsoleDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell demo>
      <ClassProvider data={DEMO} reload={() => {}}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-3 text-sm lg:px-8 print:hidden dark:border-slate-800 dark:bg-slate-900">
          <span className="text-slate-500">תצוגת דוגמה</span>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-50">י׳3 — כיתת דוגמה</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            נתונים לדוגמה — אותם חישובים שרצים על כיתה אמיתית
          </span>
        </div>
        <main className="px-6 pb-16 pt-5 lg:px-8">{children}</main>
        <DemoOverlay />
      </ClassProvider>
    </ConsoleShell>
  );
}

function DemoOverlay() {
  const { openStudent, showStudent } = useClass();
  return openStudent ? (
    <StudentPanel student={openStudent} onClose={() => showStudent(null)} onFocus={null} />
  ) : null;
}
