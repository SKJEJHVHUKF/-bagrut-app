'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Wrench, CheckCircle } from 'lucide-react';
import type { AdvancedTechnique } from '@/content/advanced-courses/types';
import { MathText } from '@/components/practice/MathText';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { buttonTap } from '@/lib/animations';

/**
 * TechniqueCard — one advanced technique (§3): when to reach for it, the
 * technique itself, and a worked example revealed step-by-step. Carries a
 * #technique-<id> anchor for "go back to technique X" links.
 */
export function TechniqueCard({ technique, index }: { technique: AdvancedTechnique; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const [stepsShown, setStepsShown] = useState(0);
  const total = technique.workedExample.steps.length;
  const allShown = stepsShown >= total;

  return (
    <div
      id={`technique-${technique.id}`}
      className="scroll-mt-24 surface-premium rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-right px-4 py-3 flex items-start gap-3 hover:bg-slate-900/[0.03] transition-colors"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center">
          <Wrench className="w-3.5 h-3.5 text-indigo-800" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-indigo-800 chat-md">
            <MathText inline>{technique.title}</MathText>
          </div>
          <div className="text-xs text-slate-600 leading-snug mt-0.5 chat-md">
            <MathText inline>{technique.when}</MathText>
          </div>
        </div>
        <div className="flex-shrink-0 text-slate-600 pt-1">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-900/[0.06] pt-3">
          <div className="chat-md text-sm text-slate-800 leading-relaxed">
            <MathText>{technique.body}</MathText>
          </div>

          {technique.diagrams && technique.diagrams.length > 0 && (
            <DiagramRenderer diagrams={technique.diagrams} />
          )}

          {/* Worked example */}
          <div className="bg-slate-900/[0.03] border border-slate-900/10 rounded-xl px-4 py-3 space-y-2.5">
            <div className="text-[10px] font-black tracking-widest text-indigo-700 uppercase">
              דוגמה פתורה
            </div>
            <div className="chat-md text-sm text-slate-900 leading-relaxed">
              <MathText>{technique.workedExample.problem}</MathText>
            </div>

            <ol className="space-y-2">
              {technique.workedExample.steps.slice(0, stepsShown).map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex gap-2.5"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-[10px] font-black text-indigo-800 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 chat-md text-sm text-slate-800">
                    <MathText>{step}</MathText>
                  </div>
                </motion.li>
              ))}
            </ol>

            {!allShown ? (
              <motion.button
                {...buttonTap}
                onClick={() => setStepsShown((n) => n + 1)}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 px-4 py-2 rounded-lg font-bold text-indigo-800 text-sm transition-colors"
              >
                {stepsShown === 0 ? 'הצג צעד ראשון' : `הצעד הבא (${stepsShown + 1}/${total})`}
              </motion.button>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2">
                <div className="text-[10px] font-black tracking-widest text-emerald-700 mb-1 uppercase flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" />
                  <span>תשובה</span>
                </div>
                <div className="text-sm font-bold text-emerald-900 chat-md">
                  <MathText inline>{technique.workedExample.answer}</MathText>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
