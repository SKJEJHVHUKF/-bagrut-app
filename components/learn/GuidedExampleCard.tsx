'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle, Compass } from 'lucide-react';
import type { GuidedExample } from '@/content/learning-paths/types';
import { MathText } from '@/components/practice/MathText';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { buttonTap } from '@/lib/animations';

const DIFF_META: Record<GuidedExample['difficulty'], { label: string; dot: string; color: string }> = {
  trivial: { label: 'טריוויאלי', dot: '⚪', color: 'text-slate-300' },
  easy: { label: 'קל', dot: '🟢', color: 'text-emerald-300' },
  mid: { label: 'בינוני', dot: '🟡', color: 'text-amber-300' },
  hard: { label: 'מאתגר', dot: '🔴', color: 'text-rose-300' },
};

/**
 * GuidedExampleCard — a fully-explained worked example. The student sees
 * the problem and the "how do I pick the method" note, then reveals the
 * steps one at a time. Each step shows the move AND the reason for it.
 */
export function GuidedExampleCard({ example, index }: { example: GuidedExample; index: number }) {
  const [open, setOpen] = useState(index === 0); // first example open by default
  const [stepsShown, setStepsShown] = useState(0);
  const [methodShown, setMethodShown] = useState(false);
  const meta = DIFF_META[example.difficulty];
  const total = example.steps.length;
  const allShown = stepsShown >= total;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-right px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-xs font-black text-purple-100">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              דוגמה מודרכת
            </span>
            <span className={`text-xs font-bold ${meta.color}`}>
              {meta.dot} {meta.label}
            </span>
          </div>
          <div className="text-sm text-white chat-md line-clamp-2">
            <MathText inline>{example.problem}</MathText>
          </div>
        </div>
        <div className="flex-shrink-0 text-slate-400 pt-1">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Problem restated */}
          <div className="bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 chat-md text-sm text-white">
            <MathText>{example.problem}</MathText>
          </div>

          {example.diagrams && example.diagrams.length > 0 && (
            <DiagramRenderer diagrams={example.diagrams} />
          )}

          {/* Method choice — the meta-skill, revealed before the steps */}
          <div className="bg-sky-500/5 border border-sky-500/30 rounded-xl px-3 py-2.5">
            <button
              onClick={() => setMethodShown((s) => !s)}
              className="w-full flex items-center gap-2 text-right"
            >
              <Compass className="w-4 h-4 text-sky-300 flex-shrink-0" />
              <span className="text-[11px] font-black tracking-widest text-sky-300 uppercase flex-1">
                איך יודעים באיזו שיטה לבחור?
              </span>
              {methodShown ? (
                <ChevronUp className="w-4 h-4 text-sky-300/70" />
              ) : (
                <ChevronDown className="w-4 h-4 text-sky-300/70" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {methodShown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                  className="chat-md text-sm text-sky-50/95 leading-relaxed mt-2"
                >
                  <MathText>{example.methodChoice}</MathText>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Steps — each shows the action and the reason */}
          <ol className="space-y-2.5">
            {example.steps.slice(0, stepsShown).map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/25 border border-purple-400/40 flex items-center justify-center text-[11px] font-black text-purple-100">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="chat-md text-sm text-slate-100 leading-relaxed">
                    <MathText>{step.action}</MathText>
                  </div>
                  <div className="chat-md text-xs text-slate-400 leading-relaxed mt-1 border-r-2 border-purple-500/30 pr-2.5">
                    <span className="font-bold text-purple-200/90">למה: </span>
                    <MathText inline>{step.why}</MathText>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>

          {!allShown ? (
            <motion.button
              {...buttonTap}
              onClick={() => setStepsShown((n) => n + 1)}
              className="w-full inline-flex items-center justify-center gap-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 px-4 py-2.5 rounded-xl font-bold text-purple-100 text-sm transition-all"
            >
              {stepsShown === 0 ? 'הצג צעד ראשון' : `הצעד הבא (${stepsShown + 1}/${total})`}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-4 py-3"
            >
              <div className="text-[11px] font-black tracking-widest text-emerald-300 mb-1.5 uppercase flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>תשובה</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-emerald-50 chat-md">
                <MathText inline>{example.answer}</MathText>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
