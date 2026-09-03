'use client';

/**
 * /console/class/[id]/report — the page a teacher prints.
 *
 * For a parents' evening, a ציון מגן to justify, the file. A REPORT, not a
 * dashboard: one page per student, nothing that only works on a screen, and
 * every number spelled out in words — "27%" teaches a parent nothing; "27% —
 * פתר 6 מתוך 22 נכון" tells them what happened.
 *
 * Reads the class from the layout's provider, so the paper and the screen come
 * from one payload and cannot disagree.
 */

import { useSearchParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { useClass } from '@/components/console/ClassContext';
import { PageHeader } from '@/components/PageHeader';
import { Btn } from '@/components/console/ui';
import type { StudentRow } from '@/lib/class-board';
import { ACTIVITY_DAYS } from '@/lib/class-board';

function agoSentence(days: number | null): string {
  if (days === null) return 'טרם התחיל לתרגל';
  if (days <= 0) return 'תרגל היום';
  if (days === 1) return 'תרגל אתמול';
  if (days === 2) return 'תרגל שלשום';
  if (days < 7) return `תרגל לפני ${days} ימים`;
  if (days < 14) return 'תרגל לפני שבוע';
  return `תרגל לפני ${Math.floor(days / 7)} שבועות`;
}

export default function ClassReportPage() {
  const { data, board, isDemo } = useClass();
  const only = useSearchParams().get('student');
  const students = only ? board.students.filter((s) => s.id === only) : board.students;

  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      <div className="print:hidden">
        <PageHeader
          title="דוחות"
          description={
            only
              ? 'דוח לתלמיד אחד. הדפסה מפיקה עמוד אחד.'
              : 'עמוד לכל תלמיד, מוכן להדפסה. הדפסה מפיקה את כל הכיתה, כל תלמיד בדף משלו.'
          }
          actions={
            <Btn kind="primary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden />
              הדפסה
            </Btn>
          }
        />
        {isDemo && (
          <p className="mb-4 text-xs text-slate-500">נתונים לדוגמה — הדוח האמיתי נראה בדיוק כך.</p>
        )}
      </div>

      <div className="surface-premium rounded-2xl px-8 py-8 print:rounded-none print:border-0 print:bg-white print:px-0 print:py-0 print:shadow-none">
        {students.map((s) => (
          <StudentReport key={s.id} student={s} klass={data.class} windowDays={data.windowDays} />
        ))}
        {students.length === 0 && <p className="text-sm text-slate-500">אין תלמידים בכיתה הזו עדיין.</p>}
      </div>
    </div>
  );
}

function StudentReport({
  student,
  klass,
  windowDays,
}: {
  student: StudentRow;
  klass: { name: string; units: number | null; schoolYear: string };
  windowDays: number;
}) {
  const activeDays = student.daily.filter((d) => d.attempts > 0).length;
  const named = student.recentWrong.filter((w) => w.note).slice(0, 5);
  const printed = new Date().toLocaleDateString('he-IL');

  return (
    // break-after so each student starts a fresh sheet — a report handed to a
    // parent must not have another child's name on the back of it.
    <article className="mb-12 break-after-page last:mb-0 last:break-after-auto print:text-black">
      <header className="border-b-2 border-slate-800 pb-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-black text-ink print:text-black">
            {student.name}
          </h2>
          <span className="text-sm text-slate-600">
            {klass.name}
            {klass.units ? ` · ${klass.units} יח״ל` : ''} · {klass.schoolYear}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          דוח תרגול · {windowDays} הימים האחרונים · הופק ב-{printed}
        </p>
      </header>

      {student.attempts === 0 ? (
        <p className="mt-6 text-slate-700">
          התלמיד מחובר לכיתה אך טרם פתר שאלות במערכת, ולכן אין עדיין נתונים לדווח עליהם. זה אינו
          ציון אפס — פשוט טרם התקיימה פעילות שניתן למדוד.
        </p>
      ) : (
        <>
          <section className="mt-5">
            <h3 className="mb-2 font-bold text-slate-900">תמונת מצב</h3>
            <p className="leading-relaxed text-slate-700">
              {student.name} פתר <strong>{student.attempts}</strong> תרגילים בתקופה זו, מתוכם{' '}
              <strong>{student.measured}</strong> נספרו למדידת שליטה (תרגילים שנפתרו בשנית נספרים
              כתרגול ולא כמדידה).
              {student.mastery !== null && (
                <>
                  {' '}
                  אחוז השליטה הכולל עומד על <strong>{Math.round(student.mastery * 100)}%</strong>.
                  היה פעיל ב-<strong>{activeDays}</strong> מתוך {ACTIVITY_DAYS} הימים האחרונים, ו
                  {agoSentence(student.daysSinceActive)}.
                </>
              )}
            </p>
          </section>

          <section className="mt-5">
            <h3 className="mb-2 font-bold text-slate-900">שליטה לפי נושא</h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600">
                  <th className="py-1.5 text-start font-medium">נושא</th>
                  <th className="py-1.5 text-center font-medium">נכונות</th>
                  <th className="py-1.5 text-center font-medium">אחוז</th>
                </tr>
              </thead>
              <tbody>
                {student.topics.map((t) => (
                  <tr key={t.topic} className="border-b border-slate-200">
                    <td className="py-1.5 text-slate-800">{t.topic}</td>
                    <td className="py-1.5 text-center tabular-nums text-slate-700">
                      {t.correct} מתוך {t.measured}
                    </td>
                    <td className="py-1.5 text-center font-semibold tabular-nums text-slate-900">
                      {t.mastery === null ? '—' : `${Math.round(t.mastery * 100)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {student.stuck.length > 0 && (
            <section className="mt-5">
              <h3 className="mb-2 font-bold text-slate-900">נושאים הדורשים חיזוק</h3>
              <ul className="list-inside list-disc space-y-1 text-slate-700">
                {student.stuck.map((t) => (
                  <li key={t.topic}>
                    <strong>{t.topic}</strong> — פתר נכון {t.correct} מתוך {t.measured} תרגילים שנמדדו.
                  </li>
                ))}
              </ul>
            </section>
          )}

          {named.length > 0 && (
            <section className="mt-5">
              <h3 className="mb-2 font-bold text-slate-900">טעויות חוזרות שזוהו</h3>
              <ul className="list-inside list-disc space-y-1 text-slate-700">
                {named.map((w, i) => (
                  <li key={i}>
                    {w.note} <span className="text-slate-500">({w.topic})</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                טעויות אלו זוהו אוטומטית מתוך התשובות עצמן, ומתארות את סוג השגיאה ולא רק את העובדה
                שהתשובה שגויה.
              </p>
            </section>
          )}
        </>
      )}

      <footer className="mt-6 border-t border-slate-300 pt-2 text-xs text-slate-500">
        הופק ממערכת MathUp. הנתונים מבוססים על תרגול שהתלמיד ביצע באפליקציה בלבד, ואינם מהווים ציון
        או הערכה חלופית למבחני הכיתה.
      </footer>
    </article>
  );
}
