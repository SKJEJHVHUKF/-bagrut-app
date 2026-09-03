'use client';

/**
 * NextStep — the console, in one sentence and one button.
 *
 * THE DESIGN PRINCIPLE FOR A TEACHER WHO DOES NOT LIKE SOFTWARE: the screen
 * says what to do next, in words, before it shows any number. Data is for the
 * teacher who wants to check; the sentence is for the teacher who wants to be
 * told. Both get what they came for, and the second one does not have to learn
 * the first one's dashboard.
 *
 * The sentence is derived, not written: it reads the same board the panels
 * read, in a fixed priority — a class-wide gap first (it is one lesson and
 * fixes many students), then the students who need the teacher, then the
 * onboarding stragglers, then "all quiet". So it can never disagree with the
 * panels below it.
 */

import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useClass } from '@/components/console/ClassContext';
import { Btn } from '@/components/console/Panel';

export default function NextStep() {
  const { board, isDemo, classId, openFocus } = useClass();
  const base = isDemo ? '/console-demo' : `/console/class/${classId}`;

  const stuck = board.needsAttention.filter((r) => r.state === 'stuck');
  const away = board.needsAttention.filter((r) => r.state === 'away');
  const fresh = board.neverStarted;
  const gap = board.reteach[0] ?? null;

  let headline: string;
  let detail: string;
  let action: React.ReactNode = null;

  if (board.studentCount === 0) {
    headline = 'הכיתה ריקה עדיין.';
    detail = 'שלח לתלמידים את קוד ההצטרפות. ברגע שהם יתחילו לתרגל, הלוח הזה יתמלא מעצמו.';
  } else if (gap) {
    headline = `הכיתה נופלת ב${gap.topic}.`;
    detail = `${gap.belowHalf} מתוך ${gap.measuredStudents} תלמידים מתחת לחצי — זה שיעור שכדאי ללמד שוב, לא תלמיד אחד. אפשר לשלוח לכולם תרגול ממוקד בנושא, ולראות כאן מחר מי סגר.`;
    action = !isDemo && (
      <Btn kind="primary" onClick={() => openFocus('class')}>
        שלח לכיתה תרגול ב{gap.topic}
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </Btn>
    );
  } else if (stuck.length > 0) {
    const first = stuck[0];
    headline =
      stuck.length === 1
        ? `${first.name} תקוע ב${first.topic}.`
        : `${stuck.length} תלמידים תקועים.`;
    detail =
      stuck.length === 1
        ? `${first.reason}. הצעד הקל: לשלוח לו תרגול קצר בדיוק בנושא הזה.`
        : `כל אחד בנושא אחר — הרשימה למטה אומרת מי ובמה. לחיצה על "שלח תרגול" ליד שם שולחת לו בדיוק את זה.`;
    action = !isDemo && stuck.length === 1 && (
      <Btn kind="primary" onClick={() => openFocus({ studentId: first.studentId, name: first.name })}>
        שלח ל{first.name} תרגול
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </Btn>
    );
  } else if (away.length > 0) {
    headline = away.length === 1 ? `${away[0].name} לא נכנס כבר ${away[0].reason.split(' ')[0]} ימים.` : `${away.length} תלמידים לא נכנסו השבוע.`;
    detail = 'לא בעיה של הבנה — בעיה של הרגל. מילה בכיתה מחר בדרך כלל מספיקה.';
  } else if (fresh > 0) {
    headline = fresh === 1 ? 'תלמיד אחד הצטרף ועוד לא התחיל.' : `${fresh} תלמידים הצטרפו ועוד לא התחילו.`;
    detail = 'אין להם עדיין נתונים — זה לא אפס, פשוט לא פתרו כלום. שווה לוודא שהם יודעים מאיפה מתחילים.';
    action = (
      <Link
        href={`${base}/students`}
        className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
      >
        מי הם
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </Link>
    );
  } else {
    headline = 'הכל בסדר השבוע.';
    detail = `${board.activeThisWeek} מתוך ${board.studentCount} תרגלו, ואף אחד לא תקוע. אפשר לסגור ולחזור מחר.`;
  }

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-md border border-slate-900 bg-slate-900 px-5 py-4 text-white dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900">
      <Sparkles className="h-5 w-5 shrink-0 opacity-70" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold">{headline}</p>
        <p className="mt-0.5 text-sm leading-relaxed opacity-80">{detail}</p>
      </div>
      {action && <div className="shrink-0 [&_button]:bg-white [&_button]:text-slate-900 [&_button:hover]:bg-slate-200 dark:[&_button]:bg-slate-900 dark:[&_button]:text-white">{action}</div>}
    </section>
  );
}
