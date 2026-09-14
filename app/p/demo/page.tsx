/**
 * /p/demo — the weekly parent page with a sample student on it. Public, noindex.
 *
 * Same rule as lib/demo-board: THE SAMPLE IS INPUT, NOT OUTPUT. A fabricated
 * answer log goes through the real buildParentWeek and the real component, so
 * the demo cannot drift from what a parent is actually sent.
 *
 * The log is local rather than lib/demo-board's: that file exports only the
 * finished class board, not its answers, and its answers all sit inside the
 * last ten days — too few pairs of weeks to show "לעומת השבוע שעבר".
 */

import type { Metadata } from 'next';
import type { BoardAttempt } from '@/lib/class-board';
import { buildParentWeek, type ParentWeek } from '@/lib/parent-report';
import { WeeklyParentReport } from '@/components/parent/WeeklyParentReport';

// Rendered per request so the dates are today's, not the build's.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'דוגמה לדוח השבועי',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

const DAY = 24 * 60 * 60 * 1000;

/** [topic, answers, of which correct, days ago, named mistake on the wrong ones] */
const WORK: [string, number, number, number, string?][] = [
  // this week
  ['טריגונומטריה', 10, 9, 1],
  ['פונקציות', 6, 5, 3],
  ['סדרות', 6, 2, 2, 'בנוסחת האיבר הכללי נכתב $n$ במקום $n-1$'],
  ['הסתברות', 3, 1, 5, 'הכפלת הסתברויות של מאורעות תלויים כאילו היו בלתי תלויים'],
  // the week before
  ['טריגונומטריה', 6, 3, 9],
  ['פונקציות', 5, 4, 10],
  ['סדרות', 4, 3, 12],
];

/** `now` is a parameter, as in lib/demo-board, so the week is built against one
 *  instant — the request's (the page is force-dynamic). */
function demoWeek(now: number = Date.now()): ParentWeek {
  const attempts: BoardAttempt[] = WORK.flatMap(([topic, total, correct, daysAgo, note]) =>
    Array.from({ length: total }, (_, k) => ({
      user_id: 'demo',
      topic,
      correct: k < correct,
      diagnosis: k >= correct && note ? { kind: 'known-mistake', note } : null,
      created_at: new Date(now - daysAgo * DAY - k * 20 * 60_000).toISOString(),
    }))
  );
  return buildParentWeek({ name: 'נועה', attempts, now });
}

export default function ParentDemoPage() {
  return <WeeklyParentReport week={demoWeek()} sample />;
}
