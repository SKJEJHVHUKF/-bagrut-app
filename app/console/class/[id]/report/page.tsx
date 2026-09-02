'use client';

/**
 * /console/class/[id]/report — the page a teacher prints.
 *
 * For a parents' evening, for a ציון מגן he has to justify, for the file. It is
 * a REPORT, not a dashboard: no filters, no tabs, no hover, nothing that only
 * works on a screen. One page per student, and it has to survive being printed
 * in black and white and handed to someone who has never seen the product.
 *
 * So every number is spelled out in words next to it — a parent reading "27%"
 * learns nothing, and a parent reading "27% — פתר 6 מתוך 22 נכון" learns what
 * happened. Colour is decoration here and carries nothing.
 *
 * ⚠️ Reads the same API as the board, so the report and the screen cannot
 * disagree. A separate "report query" is how a parent ends up holding a number
 * the teacher cannot find.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Printer } from 'lucide-react';
import type { ClassBoard, StudentRow } from '@/lib/class-board';
import { ACTIVITY_DAYS } from '@/lib/class-board';

type Payload = {
  class: { name: string; units: number | null; schoolYear: string };
  board: ClassBoard;
  windowDays: number;
};

function agoLabel(days: number | null): string {
  if (days === null) return 'טרם התחיל לתרגל';
  if (days <= 0) return 'תרגל היום';
  if (days === 1) return 'תרגל אתמול';
  if (days === 2) return 'תרגל שלשום';
  if (days < 7) return `תרגל לפני ${days} ימים`;
  if (days < 14) return 'תרגל לפני שבוע';
  return `תרגל לפני ${Math.floor(days / 7)} שבועות`;
}

export default function ClassReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const search = useSearchParams();
  const only = search.get('student');

  useEffect(() => {
    void params.then((p) => setId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/school/classes/${id}`);
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
    } catch {
      setError('לא הצלחנו לטעון את הדוח. נסה לרענן.');
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (error) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl px-4 py-10 text-slate-700">
        {error}
      </main>
    );
  }
  if (!data) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl px-4 py-10 text-slate-500">
        טוען…
      </main>
    );
  }

  const students = only
    ? data.board.students.filter((s) => s.id === only)
    : data.board.students;

  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
      {/* Everything in here is screen-only: a printed page with a "print"
          button on it is the mark of a report nobody tested on paper. */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/console/class/${id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-violet-700"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          חזרה ללוח
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
        >
          <Printer className="h-4 w-4" aria-hidden />
          הדפסה
        </button>
      </div>

      {students.map((s) => (
        <StudentReport
          key={s.id}
          student={s}
          klass={data.class}
          windowDays={data.windowDays}
        />
      ))}

      {students.length === 0 && (
        <p className="text-sm text-slate-500">אין תלמידים בכיתה הזו עדיין.</p>
      )}
    </main>
  );
}

function StudentReport({
  student,
  klass,
  windowDays,
}: {
  student: StudentRow;
  klass: Payload['class'];
  windowDays: number;
}) {
  const activeDays = student.daily.filter((d) => d.attempts > 0).length;
  const named = student.recentWrong.filter((w) => w.note).slice(0, 5);
  const printed = new Date().toLocaleDateString('he-IL');

  return (
    // break-after so each student starts a fresh sheet — a report handed to a
    // parent must not have another child's name on the back of it.
    <article className="mb-12 break-after-page last:mb-0 last:break-after-auto">
      <header className="border-b-2 border-slate-800 pb-3">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
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
            <h2 className="mb-2 font-bold text-slate-900">תמונת מצב</h2>
            {/* Spelled out, because a number alone teaches a parent nothing. */}
            <p className="leading-relaxed text-slate-700">
              {student.name} פתר <strong>{student.attempts}</strong> תרגילים בתקופה זו, מתוכם{' '}
              <strong>{student.measured}</strong> נספרו למדידת שליטה (תרגילים שנפתרו בשנית נספרים
              כתרגול ולא כמדידה).
              {student.mastery !== null && (
                <>
                  {' '}
                  אחוז השליטה הכולל שלו עומד על{' '}
                  <strong>{Math.round(student.mastery * 100)}%</strong>. הוא היה פעיל ב-
                  <strong>{activeDays}</strong> מתוך {ACTIVITY_DAYS} הימים האחרונים, ו
                  {agoLabel(student.daysSinceActive)}.
                </>
              )}
            </p>
          </section>

          <section className="mt-5">
            <h2 className="mb-2 font-bold text-slate-900">שליטה לפי נושא</h2>
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
                    <td className="py-1.5 text-center text-slate-700 tabular-nums">
                      {t.correct} מתוך {t.measured}
                    </td>
                    <td className="py-1.5 text-center font-semibold text-slate-900 tabular-nums">
                      {t.mastery === null ? '—' : `${Math.round(t.mastery * 100)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {student.stuck.length > 0 && (
            <section className="mt-5">
              <h2 className="mb-2 font-bold text-slate-900">נושאים הדורשים חיזוק</h2>
              <ul className="list-inside list-disc space-y-1 text-slate-700">
                {student.stuck.map((t) => (
                  <li key={t.topic}>
                    <strong>{t.topic}</strong> — פתר נכון {t.correct} מתוך {t.measured} תרגילים
                    שנמדדו.
                  </li>
                ))}
              </ul>
            </section>
          )}

          {named.length > 0 && (
            <section className="mt-5">
              <h2 className="mb-2 font-bold text-slate-900">טעויות חוזרות שזוהו</h2>
              <ul className="list-inside list-disc space-y-1 text-slate-700">
                {named.map((w, i) => (
                  <li key={i}>
                    {w.note} <span className="text-slate-500">({w.topic})</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                טעויות אלו זוהו אוטומטית מתוך התשובות עצמן, ומתארות את סוג השגיאה ולא רק את
                העובדה שהתשובה שגויה.
              </p>
            </section>
          )}
        </>
      )}

      <footer className="mt-6 border-t border-slate-300 pt-2 text-xs text-slate-500">
        הופק ממערכת MathUp. הנתונים מבוססים על תרגול שהתלמיד ביצע באפליקציה בלבד, ואינם מהווים
        ציון או הערכה חלופית למבחני הכיתה.
      </footer>
    </article>
  );
}
