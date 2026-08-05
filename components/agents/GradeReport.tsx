'use client';

/**
 * GradeReport — renders the typed verdict from POST /api/chat/grade.
 *
 * Pure presentation: it takes a `GradeResponse` and shows it. All math in
 * `summary` / `description` / `feedback` goes through `MathText`, so the
 * examiner can answer in LaTeX and it renders as real notation.
 */

import { MathText } from '@/components/practice/MathText';
import type { GradeResponse } from '@/lib/agents/schemas';

function scoreTone(score: number): { ring: string; text: string; label: string } {
  if (score >= 90) return { ring: 'border-emerald-500', text: 'text-emerald-600', label: 'מצוין' };
  if (score >= 75) return { ring: 'border-violet-500', text: 'text-violet-600', label: 'טוב' };
  if (score >= 55) return { ring: 'border-amber-500', text: 'text-amber-600', label: 'חלקי' };
  return { ring: 'border-rose-500', text: 'text-rose-600', label: 'דורש עבודה' };
}

export function GradeReport({
  grade,
  className = '',
}: {
  grade: GradeResponse;
  className?: string;
}) {
  const tone = scoreTone(grade.score);

  return (
    <div className={`surface-premium p-5 ${className}`} dir="rtl">
      {/* score + verdict */}
      <div className="flex items-start gap-4">
        <div
          className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 ${tone.ring} bg-white`}
        >
          <span className={`text-2xl font-bold leading-none ${tone.text}`}>{grade.score}</span>
          <span className="mt-0.5 text-[10px] text-slate-500">מתוך 100</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-semibold ${tone.text}`}>{tone.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                grade.isCorrect
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {grade.isCorrect ? 'פתרון תקין' : 'יש מה לתקן'}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {grade.unitLevel} יח״ל · שאלון {grade.formNumber}
            </span>
          </div>

          <div className="chat-md mt-2 min-w-0 text-sm text-slate-800">
            <MathText>{grade.summary}</MathText>
          </div>
        </div>
      </div>

      {/* errors */}
      {grade.errors.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">
            מה השתבש ({grade.errors.length})
          </h3>
          <ol className="space-y-2">
            {grade.errors.map((e, i) => (
              <li
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600">
                    {i + 1}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {e.errorType}
                  </span>
                </div>
                <div className="chat-md min-w-0 text-xs text-slate-500">
                  <MathText>{e.step}</MathText>
                </div>
                <div className="chat-md mt-1 min-w-0 text-sm text-slate-800">
                  <MathText>{e.description}</MathText>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* feedback */}
      <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
        <h3 className="mb-1 text-sm font-semibold text-violet-900">הצעד הבא שלך</h3>
        <div className="chat-md min-w-0 text-sm text-slate-800">
          <MathText>{grade.feedback}</MathText>
        </div>
      </div>
    </div>
  );
}
