'use client';

/**
 * /tutor — the agent workbench.
 *
 * Two agents on one screen:
 *   • right  — the Socratic tutor (streams, cheap tier)
 *   • left   — the bagrut examiner (structured verdict, stronger tier)
 *
 * Level + שאלון are LIVE controls, not constants: switching them re-targets
 * both agents, which is exactly how the 3/4-unit expansion will work — no code
 * change, just a different body parameter.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TutorChat } from '@/components/agents/TutorChat';
import { GradeReport } from '@/components/agents/GradeReport';
import { useGrade } from '@/hooks/useGrade';
import { getUnitLevel, getPaper } from '@/lib/study-plan';
import { topicsForActivePaper } from '@/content/bagrut-curriculum';
import type { BagrutPaper } from '@/content/bagrut-curriculum';

const UNIT_LEVELS = [3, 4, 5] as const;
const FORMS: BagrutPaper[] = ['571', '572'];

export default function TutorWorkbenchPage() {
  // Level + שאלון travel together, so they live in one state object: the
  // mount-time seed below is then a single setState instead of two cascading ones.
  const [ctx, setCtx] = useState<{ unitLevel: 3 | 4 | 5; formNumber: BagrutPaper }>({
    unitLevel: 5,
    formNumber: '572',
  });
  const { unitLevel, formNumber } = ctx;
  const [topic, setTopic] = useState<string>('');

  // Seed from the student's saved plan. localStorage is an external store that
  // only exists on the client, so this must run after mount — reading it during
  // render would desync the server HTML from the first client render.
  useEffect(() => {
    let seeded = { unitLevel: 5 as 3 | 4 | 5, formNumber: '572' as BagrutPaper };
    try {
      seeded = { unitLevel: getUnitLevel(), formNumber: getPaper() ?? '572' };
    } catch {
      /* no plan yet — the defaults above are already correct */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage (an external store); same pattern as /roadmap, /quiz, /practice
    setCtx(seeded);
  }, []);

  const topics = useMemo(
    () => topicsForActivePaper(formNumber).map((t) => t.key),
    [formNumber]
  );

  // A topic from the previous שאלון must not leak into the new one. Derived,
  // not reset in an effect — so switching שאלון and back restores the choice.
  const effectiveTopic = topic && topics.includes(topic) ? topic : '';

  // ---- grader panel state ----
  const [question, setQuestion] = useState('');
  const [solution, setSolution] = useState('');
  const { grade, isLoading, error, quotaExceeded, run, clear } = useGrade();

  const submitGrade = async () => {
    clear();
    await run({ solution, question, unitLevel, formNumber, topic: effectiveTopic || undefined });
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8" dir="rtl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">מורה פרטי + בוחן בגרות</h1>
        <p className="mt-1 text-sm text-slate-600">
          המורה מוביל אותך לפתרון בשאלות מנחות. הבוחן קורא פתרון שכתבת ומחזיר ציון,
          רשימת טעויות מסווגות, ומה לתקן.
        </p>
      </header>

      {/* ---- shared context controls ---- */}
      <section className="surface-premium mb-6 flex flex-wrap items-end gap-4 p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">רמה</span>
          <select
            value={unitLevel}
            onChange={(e) =>
              setCtx((c) => ({ ...c, unitLevel: Number(e.target.value) as 3 | 4 | 5 }))
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900"
          >
            {UNIT_LEVELS.map((u) => (
              <option key={u} value={u}>
                {u} יחידות
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">שאלון</span>
          <select
            value={formNumber}
            onChange={(e) =>
              setCtx((c) => ({ ...c, formNumber: e.target.value as BagrutPaper }))
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900"
          >
            {FORMS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">נושא (לא חובה — משפר דיוק)</span>
          <select
            value={effectiveTopic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900"
          >
            <option value="">כל הנושאים</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- tutor ---- */}
        <TutorChat
          unitLevel={unitLevel}
          formNumber={formNumber}
          topic={effectiveTopic || undefined}
          className="h-[34rem]"
        />

        {/* ---- grader ---- */}
        <section className="flex flex-col gap-4">
          <div className="surface-premium p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">בדיקת פתרון</h2>

            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-medium text-slate-500">
                השאלה (מומלץ מאוד)
              </span>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="העתק את נוסח השאלה…"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-400"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">
                הפתרון שלך — שורה לכל צעד
              </span>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                rows={8}
                maxLength={4000}
                placeholder={`למשל:
נגזור: f'(x) = 3x^2 - 12
נאפס: 3x^2 - 12 = 0
לכן x = 2`}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-400"
              />
            </label>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">{solution.length} / 4000</span>
              <button
                type="button"
                onClick={() => void submitGrade()}
                disabled={isLoading || solution.trim().length < 3}
                className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? 'בודק…' : 'בדוק את הפתרון'}
              </button>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
                {quotaExceeded && (
                  <Link href="/pricing" className="mr-2 font-semibold underline">
                    שדרג ל-Pro
                  </Link>
                )}
              </p>
            )}
          </div>

          {grade && <GradeReport grade={grade} />}
        </section>
      </div>
    </main>
  );
}
