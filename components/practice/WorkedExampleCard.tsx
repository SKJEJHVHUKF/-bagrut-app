'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import type { WorkedExample } from '@/content/lessons/types';
import { MathText } from './MathText';

const DIFFICULTY_META: Record<WorkedExample['difficulty'], { label: string; dot: string; color: string }> = {
  easy: { label: 'קל', dot: '🟢', color: 'text-emerald-300' },
  mid: { label: 'בינוני', dot: '🟡', color: 'text-amber-300' },
  hard: { label: 'מאתגר', dot: '🔴', color: 'text-indigo-300' },
};

export function WorkedExampleCard({ example, index }: { example: WorkedExample; index: number }) {
  const [open, setOpen] = useState(false);
  const meta = DIFFICULTY_META[example.difficulty];

  return (
    <div className="surface-premium rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-right px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/50 flex items-center justify-center text-xs font-black text-indigo-100">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              דוגמה
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
          <div className="bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 chat-md text-sm text-white">
            <MathText>{example.problem}</MathText>
          </div>

          {/* Full solution at once — like the bagrut archive, not gated. */}
          <ol className="space-y-2">
            {example.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-[11px] font-black text-indigo-100">
                  {i + 1}
                </div>
                <div className="flex-1 chat-md text-sm text-slate-100 pt-0.5">
                  <MathText>{step}</MathText>
                </div>
              </li>
            ))}
          </ol>

          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-4 py-3">
            <div className="text-[11px] font-black tracking-widest text-emerald-300 mb-1.5 uppercase flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>תשובה</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-emerald-50 chat-md">
              <MathText inline>{example.answer}</MathText>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
