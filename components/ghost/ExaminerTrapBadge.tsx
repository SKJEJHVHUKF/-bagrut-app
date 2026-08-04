'use client';

// ExaminerTrapBadge — the red flag on a step that carries a classic
// matriculation pitfall.
//
// Deliberately the loudest thing on the card: high-contrast rose border, a
// flag, and the warning in bold. It appears BEFORE the commit prompt, because
// a warning that arrives after the student has already chosen is just a
// post-mortem.
//
// Used sparingly on purpose — three flags in a five-step replay. A badge on
// every step is a badge on none.

import { Flag } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';

export function ExaminerTrapBadge({
  warning,
  description,
}: {
  warning: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-rose-500/40 bg-rose-500/[0.06] p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-700">
        <Flag className="h-3 w-3 flex-shrink-0" />
        <span>מלכודת בוחן · {warning}</span>
      </div>
      {/* chat-md sits on this block, never on the flex row above it — every
          .chat-md rule is a descendant combinator, and a flex parent would
          turn each formula into its own flex item. */}
      <div className="chat-md math-content mt-1.5 text-sm leading-relaxed text-rose-950">
        <MathText>{description}</MathText>
      </div>
    </div>
  );
}
