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

import ConsoleShell from '@/components/console/ConsoleShell';
import { ClassProvider, type ClassPayload } from '@/components/console/ClassContext';

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
        <div className="flex flex-wrap items-center gap-3 border-b border-violet-100 bg-white/50 px-6 py-3 text-sm lg:px-8 print:hidden">
          <span className="text-slate-500">תצוגת דוגמה</span>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <span className="font-display font-black text-ink">י׳3 — כיתת דוגמה</span>
          <span className="chip-primary rounded-full px-2.5 py-0.5 text-xs font-bold">
            נתונים לדוגמה — אותם חישובים שרצים על כיתה אמיתית
          </span>
        </div>
        <main className="px-6 pb-16 pt-6 lg:px-8">{children}</main>
      </ClassProvider>
    </ConsoleShell>
  );
}
