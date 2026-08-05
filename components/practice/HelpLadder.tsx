'use client';

// HelpLadder — the "למד אותי" control: three graded rungs of help, in order.
//
// Design rules this component follows deliberately:
//
// • EVERY button states what it will give before it is pressed. A student
//   deciding between "hint" and "show me everything" is really deciding how
//   much of the problem to keep — they cannot make that call if the labels
//   don't say what gets spoiled.
// • Opened rungs STAY on screen. Help that disappears when the next rung opens
//   forces a re-read; the ladder should read top-to-bottom as one explanation
//   that got progressively more concrete.
// • The depth is legible in the colour: amber (a nudge) → sky (a direction) →
//   violet (the whole thing), matching the palette the rest of the app already
//   uses for hints and solutions. One accent per rung, no gradients competing
//   with the primary action.
// • Entrance-only keyed `motion.div`. Never `AnimatePresence` — `mode="wait"`
//   has stalled exactly this kind of swap three times in this repo.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Compass, BookOpen, ChevronLeft } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { buttonTap } from '@/lib/animations';
import type { HelpLadder as Ladder, HelpTier } from '@/lib/help-ladder';

/** One visual identity per rung depth, keyed by what the rung actually gives. */
const SKIN: Record<
  HelpTier['kind'],
  { icon: typeof Lightbulb; button: string; card: string; label: string; body: string }
> = {
  hint: {
    icon: Lightbulb,
    button: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-900',
    card: 'bg-amber-500/[0.06] border-amber-500/30',
    label: 'text-amber-700',
    body: 'text-amber-950',
  },
  'first-step': {
    icon: Compass,
    button: 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/40 text-sky-900',
    card: 'bg-sky-500/[0.06] border-sky-500/30',
    label: 'text-sky-700',
    body: 'text-slate-800',
  },
  'key-points': {
    icon: Compass,
    button: 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/40 text-sky-900',
    card: 'bg-sky-500/[0.06] border-sky-500/30',
    label: 'text-sky-700',
    body: 'text-slate-800',
  },
  full: {
    icon: BookOpen,
    button: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/40 text-violet-900',
    card: 'bg-violet-500/[0.06] border-violet-500/30',
    label: 'text-violet-700',
    body: 'text-slate-800',
  },
};

export function HelpLadder({
  ladder,
  allowFull,
  openedLevels,
  onOpen,
}: {
  ladder: Ladder;
  /** The full solution rung is withheld until the student has committed — see
   *  `preAnswerTiers` in lib/help-ladder for why. */
  allowFull: boolean;
  /** Levels already open. Controlled by the parent so a miss can pre-open the
   *  hint without this component and the runner disagreeing about state. */
  openedLevels: number[];
  /** Fired once per rung. The parent records the help as taken, and handles the
   *  `full` rung itself (it owns the solution layout and the reveal state). */
  onOpen: (tier: HelpTier) => void;
}) {
  const [justOpened, setJustOpened] = useState<number | null>(null);
  const opened = new Set(openedLevels);

  const visible = ladder.tiers.filter((t) => t.kind !== 'full' || allowFull);
  // The next rung on offer: the first one not yet opened. Showing all three at
  // once would turn a graded ladder back into a menu, and the deepest option
  // always wins a menu.
  const next = visible.find((t) => !opened.has(t.level)) ?? null;

  function open(tier: HelpTier) {
    setJustOpened(tier.level);
    onOpen(tier);
  }

  return (
    <div className="space-y-2">
      {visible
        .filter((t) => opened.has(t.level) && t.kind !== 'full')
        .map((tier) => {
          const skin = SKIN[tier.kind];
          const Icon = skin.icon;
          return (
            <motion.div
              key={`tier-${tier.level}`}
              initial={justOpened === tier.level ? { opacity: 0, y: -6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-2xl border px-3.5 py-3 ${skin.card}`}
            >
              <div
                className={`flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase mb-1.5 ${skin.label}`}
              >
                <Icon className="w-3 h-3" />
                <span>{tier.title}</span>
              </div>

              <div className={`space-y-1.5 text-sm leading-relaxed ${skin.body}`}>
                {tier.body.map((line, i) => (
                  <div key={i} className="chat-md math-content">
                    <MathText>{line}</MathText>
                  </div>
                ))}
              </div>

              {tier.stepsLeft !== undefined && tier.stepsLeft > 0 && (
                <div className="mt-2 text-[11px] font-bold text-slate-500">
                  {`נשארו עוד ${tier.stepsLeft} צעדים — נסה להמשיך מכאן לבד.`}
                </div>
              )}
            </motion.div>
          );
        })}

      {next && (
        <motion.button
          {...buttonTap}
          onClick={() => open(next)}
          className={`w-full flex items-center gap-2.5 border px-3.5 py-2.5 rounded-xl transition-colors text-right ${SKIN[next.kind].button}`}
        >
          {(() => {
            const Icon = SKIN[next.kind].icon;
            return <Icon className="w-4 h-4 flex-shrink-0" />;
          })()}
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-black leading-tight">{next.title}</span>
            <span className="block text-[11px] font-bold opacity-70 leading-tight mt-0.5">
              {next.promise}
            </span>
          </span>
          <ChevronLeft className="w-4 h-4 flex-shrink-0 opacity-50" />
        </motion.button>
      )}
    </div>
  );
}
