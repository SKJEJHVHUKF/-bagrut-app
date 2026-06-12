'use client';

import type { Formula } from '@/content/lessons/types';
import { MathText } from './MathText';

export function FormulaCard({ formula }: { formula: Formula }) {
  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 sm:p-5">
      <div className="text-[11px] font-black tracking-widest text-indigo-300 mb-2 uppercase chat-md">
        <MathText inline>{formula.name}</MathText>
      </div>

      <div className="bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 mb-3 chat-md text-center text-lg">
        <MathText>{`$$${formula.latex}$$`}</MathText>
      </div>

      <div className="space-y-1.5">
        {formula.variables.map((v, i) => (
          <div key={i} className="flex gap-2 items-start text-sm">
            <div className="flex-shrink-0 chat-md text-amber-200 font-bold min-w-[2.5rem]">
              <MathText inline>{`$${v.sym}$`}</MathText>
            </div>
            <div className="text-slate-500">—</div>
            <div className="text-slate-200 chat-md flex-1">
              <MathText inline>{v.meaning}</MathText>
            </div>
          </div>
        ))}
      </div>

      {formula.note && (
        <div className="mt-3 text-xs text-slate-400 chat-md border-t border-white/5 pt-3">
          <MathText>{formula.note}</MathText>
        </div>
      )}
    </div>
  );
}
