'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, KeyRound, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { PracticeProblem } from '@/content/topics/types';
import { MathText } from '@/components/practice/MathText';
import { DifficultyDots } from './shared';

// One practice problem. Behaviour (Stage A requirement #3):
//   • Hints are revealed ONE AT A TIME — each "רמז" click uncovers the next.
//   • The full solution stays hidden until its OWN "הצג פתרון מלא" button is
//     pressed (a separate click), which the student naturally reaches after
//     working through the hints.
export function PracticeCard({
  problem,
  index,
}: {
  problem: PracticeProblem;
  index: number;
}) {
  const [open, setOpen] = useState(index === 0); // first problem expanded by default
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionShown, setSolutionShown] = useState(false);

  const hasMoreHints = hintsShown < problem.hints.length;

  return (
    <div className="surface-premium rounded-2xl overflow-hidden">
      {/* collapsible header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center font-black text-white text-sm">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">
            תרגיל {index + 1}
          </div>
          <div className="chat-md text-sm text-slate-300 line-clamp-1">
            <MathText inline>{problem.problem}</MathText>
          </div>
        </div>
        <DifficultyDots level={problem.difficulty} />
        <span className="text-slate-400 flex-shrink-0">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5">
          {/* full problem statement */}
          <div className="chat-md text-white text-[15px]">
            <MathText>{problem.problem}</MathText>
          </div>

          {/* revealed hints — accumulate one at a time */}
          <AnimatePresence initial={false}>
            {hintsShown > 0 && (
              <motion.div key="hints" className="space-y-2">
                {problem.hints.slice(0, hintsShown).map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="bg-amber-500/5 border border-amber-500/30 rounded-xl px-3 py-2.5"
                  >
                    <div className="text-[10px] font-black tracking-widest text-amber-300 mb-1 uppercase flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3" />
                      <span>רמז {i + 1}</span>
                    </div>
                    <div className="chat-md text-sm text-amber-50/95">
                      <MathText>{h}</MathText>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {hasMoreHints && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setHintsShown((n) => Math.min(n + 1, problem.hints.length))}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-4 py-2.5 rounded-xl font-bold text-amber-100 text-sm transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                <span>
                  {hintsShown === 0
                    ? 'רמז'
                    : `רמז נוסף (${hintsShown + 1}/${problem.hints.length})`}
                </span>
              </motion.button>
            )}

            {!solutionShown && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setSolutionShown(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg shadow-emerald-500/20 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>הצג פתרון מלא</span>
              </motion.button>
            )}
          </div>

          {/* full solution */}
          <AnimatePresence initial={false}>
            {solutionShown && (
              <motion.div
                key="solution"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
                className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 rounded-xl p-4"
              >
                <div className="text-[10px] font-black tracking-widest text-emerald-300 mb-2 uppercase flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3" />
                  <span>פתרון</span>
                </div>
                <ol className="space-y-2.5">
                  {problem.solution.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/25 border border-emerald-400/45 flex items-center justify-center text-[11px] font-black text-emerald-100">
                        {i + 1}
                      </div>
                      <div className="flex-1 chat-md text-sm text-slate-100 pt-0.5">
                        <MathText>{step}</MathText>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2.5">
                  <div className="text-[10px] font-black tracking-widest text-emerald-300 mb-1 uppercase flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3" />
                    <span>תשובה סופית</span>
                  </div>
                  <div className="chat-md text-sm font-bold text-emerald-50">
                    <MathText inline>{problem.solution.answer}</MathText>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
