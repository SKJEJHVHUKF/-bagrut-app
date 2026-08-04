'use client';

// FailureBranch — the part that makes this a simulator rather than a quiz.
//
// The student picked a trap. Instead of "wrong, here is the right answer",
// this walks DOWN their own road until it visibly breaks, names what it would
// cost in the real exam, and only then steers back. Seeing your own reasoning
// fail is what makes it stick; being corrected is what makes it evaporate.
//
// The student must acknowledge this before the real step is revealed — you do
// not get to skip past your own mistake.

import { motion } from 'framer-motion';
import { ArrowLeft, LifeBuoy, XCircle } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { buttonTap } from '@/lib/animations';
import type { GhostBranch } from '@/content/ghost-replay/types';

export function FailureBranch({
  branch,
  onAcknowledge,
}: {
  branch: GhostBranch;
  /** null once the step is revealed: the branch stays on screen as context —
   *  it is useful to re-read your wrong road next to the right one — but its
   *  button has nothing left to do and would just be dead UI. */
  onAcknowledge: (() => void) | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.05] p-4"
    >
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-700">
        <XCircle className="h-3 w-3 flex-shrink-0" />
        <span>בוא נלך לאן שהדרך הזאת מובילה</span>
      </div>

      <div className="chat-md math-content text-sm leading-relaxed text-slate-800">
        <MathText>{branch.whyItFails}</MathText>
      </div>

      {branch.costInExam && (
        <div className="rounded-xl border border-rose-500/25 bg-white/70 px-3 py-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">
            מה זה עולה בבגרות
          </div>
          <div className="chat-md math-content mt-0.5 text-[13px] leading-snug text-slate-700">
            <MathText>{branch.costInExam}</MathText>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.07] px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-sky-800">
          <LifeBuoy className="h-3 w-3 flex-shrink-0" />
          <span>חזרה למסלול</span>
        </div>
        <div className="chat-md math-content mt-0.5 text-sm leading-relaxed text-slate-800">
          <MathText>{branch.backOnTrack}</MathText>
        </div>
      </div>

      {onAcknowledge && (
        <motion.button
          {...buttonTap}
          onClick={onAcknowledge}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-slate-800"
        >
          <span>הבנתי — תראה לי מה באמת קורה כאן</span>
          <ArrowLeft className="h-4 w-4" />
        </motion.button>
      )}
    </motion.div>
  );
}
