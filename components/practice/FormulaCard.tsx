'use client';

import type { Formula } from '@/content/lessons/types';
import { MathText } from './MathText';

export function FormulaCard({ formula }: { formula: Formula }) {
  return (
    <div className="formula-surface rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="inline-block w-1 h-3.5 rounded-full bg-indigo-400/80" />
        <div className="text-xs font-bold tracking-wide text-indigo-800 chat-md">
          <MathText inline>{formula.name}</MathText>
        </div>
      </div>

      <div className="bg-slate-900/[0.04] border border-slate-900/10 rounded-xl px-4 py-3.5 mb-3.5 chat-md text-center text-lg shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]">
        <MathText>{`$$${formula.latex}$$`}</MathText>
      </div>

      <div className="space-y-1.5">
        {formula.variables.map((v, i) => (
          <div key={i} className="flex gap-2 items-start text-sm">
            <div className="flex-shrink-0 chat-md text-amber-800 font-bold min-w-[2.5rem]">
              <MathText inline>{`$${v.sym}$`}</MathText>
            </div>
            <div className="text-slate-500">—</div>
            <div className="text-slate-800 chat-md flex-1">
              <MathText inline>{v.meaning}</MathText>
            </div>
          </div>
        ))}
      </div>

      {formula.note && (
        <div className="mt-3 text-xs text-slate-600 chat-md border-t border-slate-900/[0.06] pt-3">
          <MathText>{formula.note}</MathText>
        </div>
      )}
    </div>
  );
}
