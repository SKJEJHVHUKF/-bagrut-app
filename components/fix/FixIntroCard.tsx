'use client';

// FixIntroCard — the always-visible header of a repair session.
//
// Deliberately NOT a gate. An earlier version of the photo-scan flow opened with
// a "how much help do you want?" screen and the owner rejected it: a student who
// pressed "fix this" has already decided. So this is a banner above the
// question, not a step in front of it — it exists so the student can always see
// WHAT is being repaired and WHY these particular questions are on screen.

import { Wrench, TrendingUp } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import type { Difficulty, WeaknessKind } from '@/lib/remediation/types';

const BAND_LABEL: Record<Difficulty, string> = {
  easy: 'קל',
  mid: 'רמת בגרות',
  hard: 'מאתגר',
};

export function FixIntroCard({
  title,
  detail,
  kind,
  band,
  total,
  compact = false,
}: {
  title: string;
  detail: string;
  kind: WeaknessKind;
  band: Difficulty;
  total: number;
  /** After the first answer. Measured at 375×812: the full card is 218px and
   *  pushed the question itself to y=360 — most of a phone screen spent
   *  re-reading text the student already read. The strip keeps the "you always
   *  know what this is" guarantee without paying for it every question. */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-rose-500/[0.07] border border-rose-500/25 px-3.5 py-2">
        <Wrench className="w-3.5 h-3.5 text-rose-700 flex-shrink-0" />
        <div className="flex-1 min-w-0 text-[12px] font-bold text-rose-900 chat-md math-content truncate">
          <MathText inline>{`מתקנים: ${title}`}</MathText>
        </div>
        <span className="text-[10px] font-bold text-slate-600 flex-shrink-0">
          {BAND_LABEL[band]}
        </span>
      </div>
    );
  }

  return (
    <div className="surface-premium rounded-3xl p-5 space-y-2.5">
      <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-rose-700 uppercase">
        <Wrench className="w-3.5 h-3.5" />
        <span>מתקנים עכשיו</span>
      </div>

      <div className="text-lg font-black text-slate-900 chat-md math-content leading-tight">
        <MathText inline>{title}</MathText>
      </div>

      <div className="text-sm text-slate-600 leading-relaxed chat-md math-content">
        <MathText>{detail}</MathText>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Template literals, not JSX text around `{expr}` — see the note in
            FixSummary: in an RTL source the space next to an expression does not
            reliably survive, and it shipped a missing space once already. */}
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-800 bg-violet-500/10 border border-violet-500/30 rounded-full px-2.5 py-1">
          <TrendingUp className="w-3 h-3" />
          {`עד ${total} שאלות, בקושי עולה`}
        </span>
        <span className="text-[11px] font-bold text-slate-600 bg-slate-900/[0.04] border border-slate-900/10 rounded-full px-2.5 py-1">
          {`מכוון ל${BAND_LABEL[band]}`}
        </span>
        {kind === 'misconception' && (
          <span className="text-[11px] font-bold text-amber-800 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1">
            טעות מזוהה בשם
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
        נסיים ברגע שתפתור שלוש שאלות נכון, לא חייבים את כולן. התשובות כאן לא משפיעות
        על הציון החזוי שלך; זה תרגול תיקון, לא מבחן.
      </p>
    </div>
  );
}
