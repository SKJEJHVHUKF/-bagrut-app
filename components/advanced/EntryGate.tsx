'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Lock, Unlock, RotateCcw, ArrowLeft, BookOpen } from 'lucide-react';
import type { EntryGate as EntryGateData, GateQuestion } from '@/content/advanced-courses/types';
import { MathText } from '@/components/practice/MathText';
import { buttonTap } from '@/lib/animations';
import { celebrateCorrect, celebrateCompletion } from '@/lib/confetti';
import { seededOrder } from '@/lib/shuffle';

const MCQ_LABELS = ['א', 'ב', 'ג', 'ד', 'ה'];

/**
 * EntryGate — the advanced course's entrance check. A few base-course
 * MCQs; passing (>= passThreshold correct) unlocks the course. Failing
 * shows TARGETED referrals back to the exact base-course concepts that
 * were missed. A "skip — I know the basics" escape hatch is always there.
 */
export function EntryGate({
  gate,
  subject,
  topic,
  passed,
  skipped,
  onPassed,
}: {
  gate: EntryGateData;
  subject: string;
  topic: string;
  passed: boolean;
  skipped: boolean;
  onPassed: (viaSkip: boolean) => void;
}) {
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [attempt, setAttempt] = useState(0); // bump to reset

  const questions = gate.questions;
  const answeredCount = Object.keys(picks).length;
  const correctCount = questions.filter((q) => picks[q.id] === q.correct).length;
  const allAnswered = answeredCount === questions.length;
  const passedNow = allAnswered && correctCount >= gate.passThreshold;
  const failedNow = allAnswered && correctCount < gate.passThreshold;
  const missed = questions.filter((q) => picks[q.id] !== undefined && picks[q.id] !== q.correct);

  const baseHref = `/learn/${subject}/${encodeURIComponent(topic)}`;

  function pick(q: GateQuestion, origIdx: number) {
    if (passed || picks[q.id] !== undefined) return;
    const next = { ...picks, [q.id]: origIdx };
    setPicks(next);
    if (origIdx === q.correct) celebrateCorrect();
    // When this was the last answer and the score passes — unlock.
    if (Object.keys(next).length === questions.length) {
      const correct = questions.filter((qq) => next[qq.id] === qq.correct).length;
      if (correct >= gate.passThreshold) {
        celebrateCompletion();
        onPassed(false);
      }
    }
  }

  function retry() {
    setPicks({});
    setAttempt((a) => a + 1);
  }

  // Already passed (this visit or a previous one) — compact success state.
  if (passed && !failedNow) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl px-4 py-3.5 flex items-center gap-3">
        <Unlock className="w-5 h-5 text-emerald-300 flex-shrink-0" />
        <div className="flex-1 text-sm text-emerald-50">
          <span className="font-bold">השער פתוח. </span>
          {skipped ? 'בחרת לדלג על הבדיקה — הקורס המתקדם פתוח לפניך.' : 'עברת את בדיקת הכניסה — הקורס המתקדם פתוח לפניך.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 surface-premium rounded-2xl px-4 py-3">
        <Lock className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed flex-1">
          {questions.length} שאלות מקורס הבסיס. צריך לפחות {gate.passThreshold} נכונות כדי לפתוח את
          הקורס המתקדם — מי שלא עובר מקבל הפניה ממוקדת לחלק שצריך לחזור עליו.
        </p>
        <motion.button
          {...buttonTap}
          onClick={() => onPassed(true)}
          className="flex-shrink-0 text-[11px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          דלג — אני יודע את הבסיס
        </motion.button>
      </div>

      {questions.map((q, qi) => {
        const picked = picks[q.id];
        const answered = picked !== undefined;
        return (
          <div key={`${q.id}-${attempt}`} className="surface-premium rounded-2xl p-4 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-[11px] font-black text-indigo-100">
                {qi + 1}
              </div>
              <div className="flex-1 chat-md text-sm sm:text-base text-white leading-relaxed pt-0.5">
                <MathText>{q.question}</MathText>
              </div>
            </div>

            <div className="space-y-2">
              {seededOrder(q.answers.length, `${q.id}-${attempt}`).map((origIdx, i) => {
                const isCorrect = origIdx === q.correct;
                const isPicked = picked === origIdx;
                return (
                  <motion.button
                    key={origIdx}
                    {...buttonTap}
                    onClick={() => pick(q, origIdx)}
                    disabled={answered}
                    className={`w-full text-right px-4 py-2.5 rounded-xl border transition-colors chat-md text-sm ${
                      answered && isCorrect
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-50'
                        : answered && isPicked
                          ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-50'
                          : answered
                            ? 'bg-white/[0.02] border-white/5 text-slate-400'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                    }`}
                  >
                    <span className="font-bold opacity-60 ml-2">{MCQ_LABELS[i]}.</span>
                    <MathText inline>{q.answers[origIdx]}</MathText>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence initial={false}>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                  className={`rounded-xl px-3 py-2 text-sm chat-md flex items-start gap-2 ${
                    picked === q.correct
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-50'
                      : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-50'
                  }`}
                >
                  {picked === q.correct ? (
                    <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <MathText inline>{q.explanation}</MathText>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Verdict */}
      <AnimatePresence>
        {passedNow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-emerald-600/15 to-teal-600/15 border border-emerald-500/40 rounded-2xl p-5 text-center space-y-2"
          >
            <Unlock className="w-9 h-9 mx-auto text-emerald-300" />
            <div className="text-2xl font-black text-emerald-100">
              {correctCount}/{questions.length} — השער נפתח!
            </div>
            <div className="text-sm text-slate-200">הבסיס יושב טוב. ממשיכים למפת סוגי השאלות.</div>
          </motion.div>
        )}

        {failedNow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 space-y-3"
          >
            <div className="text-sm font-black text-amber-100">
              {correctCount}/{questions.length} — עוד לא שם. הנה בדיוק מה לחזק:
            </div>
            <div className="space-y-1.5">
              {missed.map((q) => (
                <Link
                  key={q.id}
                  href={`${baseHref}${q.reviewRef.conceptId ? `#concept-${q.reviewRef.conceptId}` : q.reviewRef.sectionId ? `#section-${q.reviewRef.sectionId}` : ''}`}
                  className="flex items-center gap-2 text-sm text-sky-200 hover:text-sky-100 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl px-3 py-2 transition-colors"
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0 text-sky-300" />
                  <span className="flex-1">{q.reviewRef.label}</span>
                  <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
                </Link>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Link
                href={baseHref}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-4 py-2.5 rounded-xl font-bold text-emerald-100 text-sm transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>חזרה לקורס הבסיס</span>
              </Link>
              <motion.button
                {...buttonTap}
                onClick={retry}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl font-bold text-white text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>נסה שוב</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
