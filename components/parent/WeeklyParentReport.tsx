/**
 * WeeklyParentReport — one student's week, for a parent on a phone.
 *
 * Server component. Words before numbers, no tables, no percentages: a parent
 * opens this from WhatsApp and needs three answers — did practice happen, what
 * is going well, what to work on. Every judgement is lib/parent-report's; this
 * file only lays it out.
 *
 * Hebrew here is gender-neutral on purpose (noun phrases, "ימי תרגול", never
 * תרגל/תרגלה): the page does not know the student's gender and must not guess.
 */

import { MathText } from '@/components/practice/MathText';
import { weekSentence, WEEK_MS, type ParentWeek } from '@/lib/parent-report';

const PRACTICE: Record<NonNullable<ParentWeek['practiceChange']>, string> = {
  more: 'יותר תרגול מאשר בשבוע שעבר',
  less: 'פחות תרגול מאשר בשבוע שעבר',
  same: 'תרגול בהיקף דומה לשבוע שעבר',
};

function day(ts: number): string {
  return new Date(ts).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', timeZone: 'Asia/Jerusalem' });
}

export function WeeklyParentReport({ week, sample = false }: { week: ParentWeek; sample?: boolean }) {
  const comparison = week.changes.length > 0 || week.practiceChange !== null;

  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-black leading-tight text-ink sm:text-3xl">
          הדוח השבועי של {week.name}
        </h1>
        <p className="text-sm text-slate-600">
          {day(week.now - WEEK_MS)} עד {day(week.now)}
        </p>
        {sample && <p className="text-sm font-bold text-violet-700">נתונים לדוגמה</p>}
      </header>

      <section className="surface-premium rounded-2xl p-5">
        <p className="text-lg font-bold text-ink">{weekSentence(week)}</p>
        {week.empty && (
          <p className="mt-1 text-base text-slate-700">
            הדוח יתמלא מעצמו כשיהיה תרגול באפליקציה.
          </p>
        )}
      </section>

      {week.strong.length > 0 && (
        <section className="surface-premium rounded-2xl p-5">
          <h2 className="font-display text-lg font-black text-ink">מה הולך טוב</h2>
          <ul className="mt-2 space-y-1 text-base text-slate-800">
            {week.strong.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </section>
      )}

      {week.workOn.length > 0 && (
        <section className="surface-premium rounded-2xl p-5">
          <h2 className="font-display text-lg font-black text-ink">על מה כדאי לעבוד</h2>
          <ul className="mt-2 space-y-3">
            {week.workOn.map((w, i) => (
              <li key={`${w.topic}-${i}`}>
                <p className="text-base font-bold text-ink">{w.topic}</p>
                {/* Through MathText, never raw: a named mistake can carry $…$,
                    and a bare formula in an RTL line shows its dollars. */}
                {w.note && (
                  <div className="text-base leading-relaxed text-slate-700">
                    <MathText inline>{w.note}</MathText>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {comparison && (
        <section className="surface-premium rounded-2xl p-5">
          <h2 className="font-display text-lg font-black text-ink">לעומת השבוע שעבר</h2>
          <ul className="mt-2 space-y-1 text-base text-slate-800">
            {week.changes.map((c) => (
              <li key={c.topic}>{c.direction === 'up' ? `שיפור ב${c.topic}` : `ירידה ב${c.topic}`}</li>
            ))}
            {week.practiceChange && <li>{PRACTICE[week.practiceChange]}</li>}
          </ul>
        </section>
      )}

      <footer className="space-y-1 border-t border-slate-300 pt-3 text-sm text-slate-700">
        <p>
          הופק ממערכת MathUp. הנתונים מבוססים על תרגול באפליקציה בלבד, ואינם מהווים ציון או הערכה
          חלופית למבחני הכיתה.
        </p>
        <p>הקישור מציג תמיד את השבוע האחרון.</p>
      </footer>
    </main>
  );
}
