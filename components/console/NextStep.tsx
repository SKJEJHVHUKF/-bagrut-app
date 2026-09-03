'use client';

/**
 * NextStep — the console, in one sentence and one button.
 *
 * THE DESIGN PRINCIPLE FOR A TEACHER WHO DOES NOT LIKE SOFTWARE: the screen
 * says what to do next, in words, before it shows anything else. The sentence
 * is derived, not written: it reads the same board the cards read, in a fixed
 * priority — a class-wide gap first (one lesson fixes many students), then who
 * is stuck, then who has vanished, then who never started, then "all quiet".
 * It carries the one button that does that thing, and it can never disagree
 * with the cards below it because it is computed from them.
 *
 * No percentage in it, ever. Headcounts and day counts are allowed — those are
 * things a teacher says out loud.
 */

import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useClass } from '@/components/console/ClassContext';
import { Btn, btnSecondary } from '@/components/console/ui';
import { BTN } from '@/components/console/copy';

export default function NextStep() {
  const { board, isDemo, base, openFocus } = useClass();

  const stuck = board.students.filter((s) => s.state === 'stuck');
  const away = board.students.filter((s) => s.state === 'away');
  const fresh = board.students.filter((s) => s.state === 'no-data');
  const gap = board.reteach[0] ?? null;

  let headline: string;
  let detail: string;
  let action: React.ReactNode = null;

  if (board.studentCount === 0) {
    headline = 'הכיתה ריקה עדיין.';
    detail = 'שלח לתלמידים את קוד ההצטרפות. ברגע שהם יתחילו לתרגל, המסך הזה יתמלא מעצמו.';
  } else if (gap) {
    headline = `הכיתה נופלת ב${gap.topic}.`;
    detail = 'רוב הכיתה מתחת לחצי — זה שיעור, לא תלמיד. שלח לכולם תרגול קצר בנושא, ומחר תראה כאן מי סגר.';
    action = !isDemo && (
      <Btn kind="primary" onClick={() => openFocus('class', gap.topic)}>
        שלח לכיתה תרגול ב{gap.topic}
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </Btn>
    );
  } else if (stuck.length > 0) {
    const first = stuck[0];
    const topic = first.stuck[0]?.topic ?? '';
    headline = stuck.length === 1 ? `${first.name} תקוע ב${topic}.` : `${stuck.length} תלמידים תקועים.`;
    detail =
      stuck.length === 1
        ? 'הצעד הקל: לשלוח לו תרגול קצר בדיוק בנושא הזה.'
        : 'כל אחד בנושא אחר — הכרטיסים למטה אומרים מי ובמה.';
    action =
      !isDemo && stuck.length === 1 ? (
        <Btn kind="primary" onClick={() => openFocus({ studentId: first.id, name: first.name }, topic)}>
          שלח ל{first.name} תרגול
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Btn>
      ) : null;
  } else if (away.length > 0) {
    const a = away[0];
    headline =
      away.length === 1
        ? `${a.name} לא נכנס כבר ${a.daysSinceActive ?? 0} ימים.`
        : `${away.length} תלמידים לא נכנסו השבוע.`;
    detail = 'לא בעיה של הבנה — בעיה של הרגל. מילה בכיתה מחר בדרך כלל מספיקה.';
  } else if (fresh.length > 0) {
    headline =
      fresh.length === 1 ? 'תלמיד אחד הצטרף ועוד לא התחיל.' : `${fresh.length} תלמידים הצטרפו ועוד לא התחילו.`;
    detail = 'אין להם עדיין נתונים — זה לא אפס, פשוט לא פתרו כלום. שווה לוודא שהם יודעים מאיפה מתחילים.';
    action = (
      <Link href={`${base}/students`} className={btnSecondary}>
        מי הם
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </Link>
    );
  } else {
    headline = 'הכל בסדר השבוע.';
    detail = `${board.activeThisWeek} מתוך ${board.studentCount} תרגלו, ואף אחד לא תקוע. אפשר לסגור ולחזור מחר.`;
  }

  return (
    <section className="surface-premium flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
        <Sparkles className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-black text-ink">{headline}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{detail}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {/* BTN is imported so the file fails to compile if the vocabulary moves. */}
      <span className="sr-only">{BTN.send}</span>
    </section>
  );
}
