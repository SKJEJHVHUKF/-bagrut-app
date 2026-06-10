'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Lightbulb, KeyRound, CheckCircle, ArrowLeft, LifeBuoy, FileText } from 'lucide-react';
import type { BagrutQuestion, BagrutPart } from '@/content/learning-paths/types';
import { MathText } from '@/components/practice/MathText';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { buttonTap } from '@/lib/animations';
import { sparkle } from '@/lib/confetti';

/**
 * BagrutQuestionBlock — a full multi-part bagrut question (level 3). Shared
 * context + optional figure up top, then each sub-part (א/ב/ג…) as its own
 * card with gradual hints, a hidden full solution revealed to compare, and
 * a "go back to section X" pointer. Fully static — no API calls.
 */
export function BagrutQuestionBlock({ q, index }: { q: BagrutQuestion; index: number }) {
  return (
    <div className="bg-white/[0.03] border border-purple-500/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-l from-purple-600/15 to-pink-600/10 border-b border-white/10 px-4 py-3 flex items-center gap-2.5">
        <FileText className="w-4 h-4 text-purple-200 flex-shrink-0" />
        <span className="text-[11px] font-black tracking-widest text-purple-200 uppercase">
          שאלת בגרות מלאה {index + 1}
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Shared context */}
        {q.context && (
          <div className="bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 chat-md text-sm text-white leading-relaxed">
            <MathText>{q.context}</MathText>
          </div>
        )}

        {q.diagrams && q.diagrams.length > 0 && <DiagramRenderer diagrams={q.diagrams} />}

        {/* Sub-parts */}
        <div className="space-y-2.5">
          {q.parts.map((part) => (
            <BagrutPartCard key={part.label} part={part} context={q.context} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BagrutPartCard({ part, context }: { part: BagrutPart; context: string }) {
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionShown, setSolutionShown] = useState(false);
  const [answer, setAnswer] = useState('');

  const struggling = hintsShown > 0 || solutionShown;

  function revealHint() {
    setHintsShown((n) => {
      const next = Math.min(n + 1, part.hints.length);
      sparkle();
      toast.info(`סעיף ${part.label} · רמז ${next}/${part.hints.length}`, { duration: 2000 });
      return next;
    });
  }

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 space-y-3">
      {/* Part header + prompt */}
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-purple-500/30">
          {part.label}
        </div>
        <div className="flex-1 chat-md text-sm sm:text-base text-white leading-relaxed pt-0.5">
          <MathText>{part.prompt}</MathText>
        </div>
      </div>

      {part.diagrams && part.diagrams.length > 0 && <DiagramRenderer diagrams={part.diagrams} />}

      {/* Answer scratch box */}
      {!solutionShown && (
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="התשובה שלך…"
          rows={2}
          dir="auto"
          className="w-full bg-slate-950/50 border border-white/10 focus:border-purple-500/60 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors resize-y"
        />
      )}

      {/* Hints one-by-one */}
      <AnimatePresence initial={false}>
        {hintsShown > 0 && (
          <motion.div
            key="hints"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {part.hints.slice(0, hintsShown).map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-amber-500/5 border border-amber-500/30 rounded-lg px-3 py-2 chat-md"
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

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {hintsShown < part.hints.length && !solutionShown && (
          <motion.button
            {...buttonTap}
            onClick={revealHint}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-lg font-bold text-amber-100 text-sm transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span>
              {hintsShown === 0 ? 'רמז' : `רמז נוסף (${hintsShown + 1}/${part.hints.length})`}
            </span>
          </motion.button>
        )}
        {!solutionShown && (
          <motion.button
            {...buttonTap}
            onClick={() => setSolutionShown(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2 rounded-lg font-bold text-white text-sm shadow-lg shadow-purple-500/30 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            <span>הצג פתרון</span>
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
            className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-3.5"
          >
            <div className="text-[10px] font-black tracking-widest text-purple-300 mb-2 uppercase flex items-center gap-1.5">
              <KeyRound className="w-3 h-3" />
              <span>פתרון סעיף {part.label}</span>
            </div>
            <ol className="space-y-2.5">
              {part.solution.steps.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 + i * 0.06, ease: 'easeOut' }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-[11px] font-black text-purple-100">
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
                <MathText inline>{part.solution.finalAnswer}</MathText>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {struggling && part.reviewIfStuck && (
        <a
          href={`#concept-${part.reviewIfStuck.conceptId}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-300/90 hover:text-sky-200 transition-colors"
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>נתקעת? חזור ל: {part.reviewIfStuck.label}</span>
          <ArrowLeft className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
