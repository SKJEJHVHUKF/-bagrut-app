'use client';

/**
 * RepairSuggestion — one tap out of a rejected read.
 *
 * The pipeline refuses to solve a transcription the validator rejected, and it
 * is right to: answering a misread question confidently is the worst thing this
 * screen can do. But the refusal alone leaves the student with one option —
 * retype the equation — which is exactly what someone who photographed it to
 * avoid typing will not do.
 *
 * For the failure that actually happens in the field (`x²` read as `x°`, which
 * silently lowers the degree of the polynomial) we already know what went
 * wrong. This turns that knowledge into a button.
 *
 * TWO RULES IT ENFORCES:
 *  1. The corrected question is SHOWN before it is solved. Swapping a student's
 *     question for a different one and answering that is the same failure as
 *     answering the misread, one step later — so the proposal is legible, not
 *     an "auto-fix" toast.
 *  2. It renders nothing when `proposeRepair` abstains, which is most of the
 *     time. A repair offered on a correct read is noise that trains the student
 *     to tap without reading.
 */

import { useMemo } from 'react';
import { Wand2, ArrowLeft } from 'lucide-react';
import { proposeRepair } from '@/lib/mathscan/repair';
import { MathText } from '@/components/practice/MathText';

export function RepairSuggestion({
  question,
  onApply,
  busy,
}: {
  question: string;
  onApply: (corrected: string) => void;
  busy: boolean;
}) {
  const repair = useMemo(() => proposeRepair(question), [question]);
  if (!repair) return null;

  return (
    <div className="scan-card border border-amber-500/35 bg-amber-500/[0.07] rounded-2xl p-4">
      <div className="flex items-start gap-2.5 mb-3">
        <Wand2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">נראה שהזיהוי פספס משהו</div>
          <p className="text-xs text-slate-600 leading-snug mt-0.5">{repair.reason}</p>
        </div>
      </div>

      {/* The corrected question, rendered as maths — the student is approving
          a specific equation, not a vague offer to "fix it". */}
      <div
        className="text-sm bg-white/70 border border-amber-500/25 rounded-xl px-3 py-2 mb-3 overflow-x-auto"
        style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}
      >
        <MathText>{`$${repair.text}$`}</MathText>
      </div>

      <button
        onClick={() => onApply(repair.text)}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl px-4 py-2.5 transition-colors"
      >
        <span>{busy ? 'פותר…' : `${repair.label} ופתור`}</span>
        {!busy && <ArrowLeft className="w-4 h-4" aria-hidden />}
      </button>

      <p className="mt-2 text-[11px] text-slate-500 text-center">
        לא זה? אפשר לתקן את הנוסח ידנית למטה.
      </p>
    </div>
  );
}
