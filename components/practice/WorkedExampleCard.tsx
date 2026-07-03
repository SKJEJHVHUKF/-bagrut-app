'use client';

import { useState } from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';
import type { WorkedExample } from '@/content/lessons/types';
import { MathText } from './MathText';

const DIFFICULTY_META: Record<WorkedExample['difficulty'], { label: string; dot: string; color: string }> = {
  easy: { label: 'קל', dot: '🟢', color: 'text-emerald-700' },
  mid: { label: 'בינוני', dot: '🟡', color: 'text-amber-700' },
  hard: { label: 'מאתגר', dot: '🔴', color: 'text-indigo-700' },
};

export function WorkedExampleCard({ example, index }: { example: WorkedExample; index: number }) {
  const [open, setOpen] = useState(false);
  const meta = DIFFICULTY_META[example.difficulty];

  return (
    <div className="surface-premium rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-right px-4 py-3.5 flex items-start gap-3 hover:bg-slate-900/[0.04] active:bg-slate-900/[0.05] transition-colors"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/50 flex items-center justify-center text-xs font-black text-indigo-800">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-wide text-slate-600">דוגמה פתורה</span>
            <span className={`text-xs font-bold ${meta.color}`}>
              {meta.dot} {meta.label}
            </span>
          </div>
          <div className="text-sm text-slate-900 chat-md line-clamp-2">
            <MathText inline>{example.problem}</MathText>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 text-indigo-700 pt-0.5">
          <span className="text-[11px] font-semibold whitespace-nowrap">
            {open ? 'הסתר' : 'הצג פתרון'}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-slate-900/[0.03] border border-slate-900/10 rounded-xl px-4 py-3 chat-md text-sm text-slate-900">
            <MathText>{example.problem}</MathText>
          </div>

          {/* Full solution at once — like the bagrut archive, not gated. */}
          <ol className="space-y-2">
            {example.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-[11px] font-black text-indigo-800">
                  {i + 1}
                </div>
                <div className="flex-1 chat-md text-sm text-slate-800 pt-0.5">
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
