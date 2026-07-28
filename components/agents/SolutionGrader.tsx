'use client';

/**
 * SolutionGrader — "I solved it on paper, now mark it properly".
 *
 * The gap this closes: until now a student who solved on paper could only
 * self-assess ("פתרתי נכון" / "טעיתי"), which is exactly the judgement a stuck
 * student is worst at. This sends the written solution to the examiner agent
 * and returns a real score plus the specific step that broke.
 *
 * Self-contained on purpose — it reads the level and שאלון from the student's
 * own study plan, so every call site only has to pass the question text. That
 * keeps `QuestionPartCard` / `QuestionRunnerCard` free of agent plumbing.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ClipboardCheck, X, BookmarkPlus, Check } from 'lucide-react';
import { GradeReport } from './GradeReport';
import { useGrade } from '@/hooks/useGrade';
import { getUnitLevel, getPaper } from '@/lib/study-plan';
import { recordMistake } from '@/lib/mistakes';
import type { UnitLevel } from '@/lib/study-plan';
import type { BagrutPaper } from '@/content/bagrut-curriculum';

type Props = {
  /** The question being answered — grading without it is much weaker. */
  questionText?: string;
  topic?: string;
  subject?: string;
  subTopicId?: string;
  questionId?: string;
  onClose?: () => void;
};

export function SolutionGrader({
  questionText,
  topic,
  subject = 'math5',
  subTopicId,
  questionId,
  onClose,
}: Props) {
  const [solution, setSolution] = useState('');
  const [plan, setPlan] = useState<{ unitLevel: UnitLevel; formNumber: BagrutPaper }>({
    unitLevel: 5,
    formNumber: '572',
  });
  const [saved, setSaved] = useState(false);
  const { grade, isLoading, error, quotaExceeded, run } = useGrade();

  useEffect(() => {
    let next = { unitLevel: 5 as UnitLevel, formNumber: '572' as BagrutPaper };
    try {
      next = { unitLevel: getUnitLevel(), formNumber: getPaper() ?? '572' };
    } catch {
      /* no plan yet — defaults stand */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage (an external store)
    setPlan(next);
  }, []);

  const submit = async () => {
    setSaved(false);
    await run({
      solution,
      question: questionText,
      topic,
      unitLevel: plan.unitLevel,
      formNumber: plan.formNumber,
    });
  };

  /** Push the examiner's findings into the מחברת טעויות, one row per error. */
  const saveToNotebook = () => {
    if (!grade || saved) return;
    for (const e of grade.errors) {
      recordMistake({
        subject,
        topic: topic ?? '',
        subTopicId,
        questionId,
        questionText,
        userAnswer: e.step,
        correctAnswer: e.description,
        category: e.errorType, // already narrowed to the notebook's 8 categories
        source: 'bagrut',
      });
    }
    setSaved(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-900/10 bg-white p-4"
      dir="rtl"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-indigo-600" />
          <h4 className="text-sm font-bold text-slate-900">בדיקת הפתרון שכתבת</h4>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
            {plan.unitLevel} יח״ל · {plan.formNumber}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="סגור"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!grade && (
        <>
          <p className="mb-2 text-xs text-slate-500">
            העתק את הפתרון שכתבת על הדף — שורה לכל צעד. תקבל ציון, את הצעד שבו נשברת,
            וסיווג של כל טעות.
          </p>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={7}
            maxLength={4000}
            placeholder={'נגזור: ...\nנאפס: ...\nלכן: ...'}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">{solution.length} / 4000</span>
            <button
              onClick={() => void submit()}
              disabled={isLoading || solution.trim().length < 3}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? 'בודק…' : 'בדוק'}
            </button>
          </div>
        </>
      )}

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

      {grade && (
        <>
          <GradeReport grade={grade} className="!p-0 !shadow-none !border-0" />
          {grade.errors.length > 0 && (
            <button
              onClick={saveToNotebook}
              disabled={saved}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-900/10 bg-slate-900/[0.03] px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-900/5 disabled:opacity-60"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>נשמר למחברת הטעויות</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4" />
                  <span>שמור {grade.errors.length} טעויות למחברת</span>
                </>
              )}
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}
