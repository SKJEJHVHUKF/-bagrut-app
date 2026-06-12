'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';
import type { CheckQuestion } from '@/content/learning-paths/types';
import { MathText } from '@/components/practice/MathText';
import { buttonTap } from '@/lib/animations';
import { celebrateCorrect, celebrateCompletion } from '@/lib/confetti';
import { seededOrder } from '@/lib/shuffle';

const MCQ_LABELS = ['א', 'ב', 'ג', 'ד', 'ה'];

/**
 * ComprehensionCheck — the mastery gate. A short set of instant-graded
 * MCQs. Each reveals a one-line explanation after answering. When every
 * question has been answered, a readiness summary appears and the section
 * is marked complete via onComplete.
 */
export function ComprehensionCheck({
  questions,
  onComplete,
}: {
  questions: CheckQuestion[];
  onComplete: () => void;
}) {
  const [picks, setPicks] = useState<Record<string, number>>({});

  const answeredCount = Object.keys(picks).length;
  const correctCount = questions.filter((q) => picks[q.id] === q.correct).length;
  const allAnswered = answeredCount === questions.length;

  function pick(q: CheckQuestion, origIdx: number) {
    if (picks[q.id] !== undefined) return;
    const next = { ...picks, [q.id]: origIdx };
    setPicks(next);
    if (origIdx === q.correct) celebrateCorrect();

    // Fire completion when this answer was the last one.
    if (Object.keys(next).length === questions.length) {
      celebrateCompletion();
      onComplete();
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 leading-relaxed">
        ענה על כל השאלות כדי לוודא שאתה שולט בנושא לפני שאתה ממשיך הלאה. תשובה נבדקת מיד.
      </p>

      {questions.map((q, qi) => {
        const picked = picks[q.id];
        const answered = picked !== undefined;
        return (
          <div key={q.id} className="surface-premium rounded-2xl p-4 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-[11px] font-black text-slate-200">
                {qi + 1}
              </div>
              <div className="flex-1 chat-md text-sm sm:text-base text-white leading-relaxed pt-0.5">
                <MathText>{q.question}</MathText>
              </div>
            </div>

            <div className="space-y-2">
              {seededOrder(q.answers.length, q.id).map((origIdx, i) => {
                const ans = q.answers[origIdx];
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
                    <MathText inline>{ans}</MathText>
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

      {/* Readiness summary */}
      <AnimatePresence>
        {allAnswered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-gradient-to-br from-emerald-600/15 to-teal-600/15 border border-emerald-500/40 rounded-2xl p-5 text-center space-y-2"
          >
            <Trophy className="w-9 h-9 mx-auto text-amber-300" />
            <div className="text-3xl font-black text-emerald-100">
              {correctCount}/{questions.length}
            </div>
            <div className="text-sm text-slate-200">
              {correctCount === questions.length
                ? '🌟 שליטה מלאה — אתה מוכן לנושא הבא!'
                : correctCount >= Math.ceil(questions.length * 0.6)
                  ? '✨ כמעט שם. חזור על השאלות ששגית ועל המושגים שלהן.'
                  : '💪 כדאי לחזור על המושגים והדוגמאות לפני שממשיכים.'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
