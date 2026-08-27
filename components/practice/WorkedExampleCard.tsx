'use client';

import { useState } from 'react';
import { ChevronDown, CheckCircle, PencilLine } from 'lucide-react';
import type { WorkedExample } from '@/content/lessons/types';
import { MathText } from './MathText';

const DIFFICULTY_META: Record<WorkedExample['difficulty'], { label: string; dot: string; color: string }> = {
  easy: { label: 'קל', dot: '🟢', color: 'text-emerald-700' },
  mid: { label: 'בינוני', dot: '🟡', color: 'text-amber-700' },
  hard: { label: 'מאתגר', dot: '🔴', color: 'text-violet-700' },
};

// A worked example sits INSIDE a white lesson-step card, so a second white
// card read as more of the same prose and students scrolled past it. It is
// tinted and edged so it reads as "here is one solved in full". The header IS
// the problem: opening the card reveals the steps and answer right under it,
// never a second copy of the question (the clamp only applies while closed).
export function WorkedExampleCard({ example, index }: { example: WorkedExample; index: number }) {
  const [open, setOpen] = useState(false);
  const meta = DIFFICULTY_META[example.difficulty];

  return (
    <div className="rounded-2xl overflow-hidden bg-violet-500/[0.06] border border-violet-500/25 border-s-4 border-s-violet-500">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-right px-4 py-3.5 flex items-start gap-3 hover:bg-violet-500/[0.06] active:bg-violet-500/[0.08] transition-colors"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-black text-white shadow-sm shadow-violet-500/30">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-black tracking-wide text-violet-800">
              <PencilLine className="w-3.5 h-3.5" />
              דוגמה פתורה
            </span>
            <span className={`text-xs font-bold ${meta.color}`}>
              {meta.dot} {meta.label}
            </span>
          </div>
          <div className={`text-[15px] font-semibold leading-relaxed text-slate-900 chat-md ${open ? '' : 'line-clamp-2'}`}>
            <MathText inline>{example.problem}</MathText>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 text-violet-700 pt-0.5">
          <span className="text-[11px] font-bold whitespace-nowrap">
            {open ? 'הסתר פתרון' : 'הצג פתרון'}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Full solution at once — like the bagrut archive, not gated. */}
          <div className="text-[10px] font-black tracking-widest text-violet-700 uppercase">הפתרון, צעד אחר צעד</div>
          {/* space-y-4, not space-y-2: the steps are full sentences of maths and
              at the tighter rhythm they read as one paragraph. */}
          <ol className="space-y-4">
            {example.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-violet-400/60 flex items-center justify-center text-[11px] font-black text-violet-800">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0 chat-md text-sm leading-relaxed text-slate-800 pt-0.5">
                  <MathText>{step}</MathText>
                </div>
              </li>
            ))}
          </ol>

          <div className="result-box rounded-xl px-4 py-3.5">
            <div className="text-[11px] font-bold tracking-wide text-emerald-700 mb-1.5 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>תשובה</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-900 chat-md">
              <MathText inline>{example.answer}</MathText>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
