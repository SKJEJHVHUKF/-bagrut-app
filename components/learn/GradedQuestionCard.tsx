'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Lightbulb, KeyRound, CheckCircle, ArrowLeft, LifeBuoy } from 'lucide-react';
import type { GradedQuestion } from '@/content/learning-paths/types';
import { MathText } from '@/components/practice/MathText';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { buttonTap } from '@/lib/animations';
import { sparkle, celebrateCorrect } from '@/lib/confetti';
import { seededOrder } from '@/lib/shuffle';

const MCQ_LABELS = ['א', 'ב', 'ג', 'ד', 'ה'];

/**
 * GradedQuestionCard — one practice question (levels 1-2). Supports MCQ
 * (instant local grading, zero API) and open (reveal solution to compare).
 * Hints reveal one-by-one; the full solution is hidden until asked for;
 * a "if you got stuck, go back to…" pointer deep-links to the concept atom.
 */
export function GradedQuestionCard({ q, index }: { q: GradedQuestion; index: number }) {
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionShown, setSolutionShown] = useState(false);
  const [selected, setSelected] = useState<number | null>(null); // original index
  const [answer, setAnswer] = useState('');

  const struggling = hintsShown > 0 || solutionShown;

  // Deterministic per-question option order (seeded by id) so the correct
  // answer isn't always first. Stable across renders and SSR-safe.
  const mcqOrder = useMemo(
    () => (q.kind === 'mcq' ? seededOrder(q.answers.length, q.id) : []),
    [q],
  );

  function revealHint() {
    setHintsShown((n) => {
      const next = Math.min(n + 1, q.hints.length);
      sparkle();
      toast.info(`רמז ${next} מתוך ${q.hints.length}`, { duration: 2000 });
      return next;
    });
  }

  function showSolution() {
    setSolutionShown(true);
  }

  function pickMCQ(origIdx: number) {
    if (q.kind !== 'mcq' || selected !== null) return;
    setSelected(origIdx);
    if (origIdx === q.correct) {
      celebrateCorrect();
      toast.success('תשובה נכונה! 🎯', { duration: 1500 });
    } else {
      toast.error('לא נכון — בדוק את הפתרון', { duration: 2000 });
    }
    setSolutionShown(true);
  }

  return (
    <div className="surface-premium rounded-2xl p-4 space-y-3">
      {/* Question */}
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-500 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-indigo-500/30">
          {index + 1}
        </div>
        <div className="flex-1 chat-md text-sm sm:text-base text-white leading-relaxed pt-0.5">
          <MathText>{q.question}</MathText>
        </div>
      </div>

      {q.diagrams && q.diagrams.length > 0 && <DiagramRenderer diagrams={q.diagrams} />}

      {/* MCQ options */}
      {q.kind === 'mcq' && (
        <div className="space-y-2">
          {mcqOrder.map((origIdx, i) => {
            const ans = q.answers[origIdx];
            const show = selected !== null;
            const isCorrect = origIdx === q.correct;
            const isSelected = selected === origIdx;
            return (
              <motion.button
                key={origIdx}
                {...buttonTap}
                onClick={() => pickMCQ(origIdx)}
                disabled={selected !== null}
                className={`w-full text-right px-4 py-2.5 rounded-xl border transition-colors chat-md text-sm ${
                  show && isCorrect
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-50'
                    : show && isSelected
                      ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-50'
                      : show
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
      )}

      {/* Open answer */}
      {q.kind === 'open' && !solutionShown && (
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="כתוב כאן את התשובה שלך (נסה לבד לפני שאתה חושף את הפתרון)…"
          rows={2}
          dir="auto"
          className="w-full bg-slate-950/50 border border-white/10 focus:border-indigo-500/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors resize-y"
        />
      )}

      {/* Hints — one by one */}
      <AnimatePresence initial={false}>
        {hintsShown > 0 && (
          <motion.div
            key="hints"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {q.hints.slice(0, hintsShown).map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-amber-500/5 border border-amber-500/30 rounded-xl px-3 py-2.5 chat-md"
              >
                <div className="text-[10px] font-black tracking-widest text-amber-300 mb-1 uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-3 h-3" />
                  <span>רמז {i + 1}</span>
                </div>
                <div className="text-sm text-amber-50/95">
                  <MathText>{h}</MathText>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {hintsShown < q.hints.length && !solutionShown && (
          <motion.button
            {...buttonTap}
            onClick={revealHint}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-4 py-2.5 rounded-xl font-bold text-amber-100 text-sm transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span>{hintsShown === 0 ? 'רמז' : `רמז נוסף (${hintsShown + 1}/${q.hints.length})`}</span>
          </motion.button>
        )}
        {!solutionShown && (
          <motion.button
            {...buttonTap}
            onClick={showSolution}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-4 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg shadow-indigo-500/30 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            <span>{q.kind === 'open' ? 'הצג פתרון להשוואה' : 'הצג פתרון מלא'}</span>
          </motion.button>
        )}
      </div>

      {/* Solution */}
      <AnimatePresence initial={false}>
        {solutionShown && (
          <motion.div
            key="solution"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
            className="bg-gradient-to-br from-indigo-600/10 to-indigo-600/10 border border-indigo-500/30 rounded-xl p-4"
          >
            <div className="text-[10px] font-black tracking-widest text-indigo-300 mb-2 uppercase flex items-center gap-1.5">
              <KeyRound className="w-3 h-3" />
              <span>פתרון</span>
            </div>
            <ol className="space-y-2.5">
              {q.solution.steps.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 + i * 0.06, ease: 'easeOut' }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/30 border border-indigo-400/50 flex items-center justify-center text-[11px] font-black text-indigo-100">
                    {i + 1}
                  </div>
                  <div className="flex-1 chat-md text-sm text-slate-100 pt-0.5">
                    <MathText>{step}</MathText>
                  </div>
                </motion.li>
              ))}
            </ol>
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2.5">
              <div className="text-[10px] font-black tracking-widest text-emerald-300 mb-1 uppercase flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" />
                <span>תשובה סופית</span>
              </div>
              <div className="text-sm font-bold text-emerald-50 chat-md">
                <MathText inline>{q.solution.finalAnswer}</MathText>
              </div>
            </div>
            {q.solution.explanation && (
              <div className="mt-2.5 text-xs text-slate-400 chat-md leading-relaxed">
                <MathText>{q.solution.explanation}</MathText>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* "If you got stuck here — go back to section X" */}
      {struggling && q.reviewIfStuck && (
        <a
          href={`#concept-${q.reviewIfStuck.conceptId}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-300/90 hover:text-sky-200 transition-colors"
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>נתקעת? חזור ל: {q.reviewIfStuck.label}</span>
          <ArrowLeft className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
