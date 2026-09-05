'use client';

// CommitPrompt — the gate. Nothing past this renders until the student takes
// a position.
//
// Once the step SETTLES the options lock and colour: the correct one emerald,
// the wrong ones rose, the rest dimmed. That is the same visual language
// QuestionRunnerCard already uses for MCQ, so a student who has practised in
// this app reads it without being taught.
//
// Owner, 2026-09-05: "אני רוצה שתיתן כמה ניסיונות לענות את התשובה הנכונה ולא
// שישר יתן את התשובה." So a wrong pick no longer ends the step. It is marked ✗
// and taken off the table, and the step stays open for up to
// machine.maxTries(step) wrong tries before the answer is shown.
//
// The original design note here argued the opposite — that a retry turns "what
// do you think happens next" into "guess until the green one". Two things keep
// that from happening: the correct option is NOT revealed while tries remain
// (nothing turns emerald until the step settles), and `firstTryCorrect`, which
// is what the rung's stars are computed from, still counts only the first
// position the student took. Guessing costs the star either way.

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { buttonTap } from '@/lib/animations';
import { seededOrder } from '@/lib/shuffle';
import type { GhostOption } from '@/content/ghost-replay/types';

const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה'];

export function CommitPrompt({
  question,
  options,
  seed,
  committedOptionId,
  wrongPicks = [],
  triesLeft = 0,
  onCommit,
}: {
  question: string;
  options: GhostOption[];
  /** Stable per step — drives the deterministic option order. */
  seed: string;
  /** null until the step settles (a correct pick, or the last allowed wrong one). */
  committedOptionId: string | null;
  /** Option ids already tried and found wrong — shown ✗ and not offered again. */
  wrongPicks?: string[];
  /** Wrong tries still available; 0 once the step has settled. */
  triesLeft?: number;
  onCommit: (optionId: string) => void;
}) {
  // House convention (lib/shuffle.ts): the correct option is AUTHORED first for
  // readability and scattered deterministically at render time. Skipping the
  // second half of that is the "option א is always correct" bug the question
  // bank already had once — 428 questions written `correct: 0`, and a student
  // who always pressed א scored ~97%. Seeded, so the order is identical on the
  // server and after hydration and does not reshuffle when they pick.
  const order = useMemo(() => seededOrder(options.length, seed), [options.length, seed]);
  const shown = useMemo(() => order.map((i) => options[i]), [order, options]);

  const locked = committedOptionId !== null;

  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.05] p-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-violet-700">
          עצור — תתחייב לפני שתראה
        </div>
        <div className="chat-md math-content mt-1 text-[15px] font-bold leading-relaxed text-slate-900">
          <MathText>{question}</MathText>
        </div>
      </div>

      <div className="space-y-2">
        {shown.map((option, i) => {
          // Every option tried and found wrong stays rose and ✗ — including the
          // one that settled the step. `isChosen` alone was not enough once a
          // step can hold more than one wrong pick.
          const isChosen = wrongPicks.includes(option.id) || committedOptionId === option.id;
          let cls =
            'bg-slate-900/[0.03] hover:bg-slate-900/[0.06] border-slate-900/10 text-slate-900';
          if (locked && option.isCorrect) {
            cls = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900';
          } else if (isChosen) {
            cls = 'bg-rose-500/15 border-rose-500/50 text-rose-900';
          } else if (locked) {
            // slate-400 here measured 2.48:1 — under the 4.5:1 floor for the
            // options the student re-reads after committing. Dimmed must still
            // be legible; slate-600 keeps the de-emphasis and clears AA.
            cls = 'bg-slate-900/[0.02] border-slate-900/[0.06] text-slate-600';
          }

          return (
            <motion.button
              key={option.id}
              {...buttonTap}
              onClick={() => onCommit(option.id)}
              disabled={locked || wrongPicks.includes(option.id)}
              className={`flex w-full items-start gap-2 rounded-xl border px-4 py-3 text-right text-sm transition-colors disabled:cursor-default ${cls}`}
            >
              {/* No opacity: CSS opacity composites the glyph with whatever is
                  behind it, which dropped the letter to 1.7-3.4:1 in three of
                  the four option states. A fixed muted colour de-emphasises it
                  without going under the floor. */}
              <span className="mt-0.5 flex-shrink-0 font-bold text-slate-500">{LETTERS[i]}.</span>
              <span className="chat-md math-content min-w-0 flex-1">
                <MathText inline>{option.text}</MathText>
              </span>
              {locked && option.isCorrect && (
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
              )}
              {isChosen && !option.isCorrect && (
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* slate-400 at 11px was ~2.6:1 against the ivory canvas — under the 4.5:1
          AA floor, and this is the one line that explains the entire rule of the
          feature. slate-600 at 12px clears it. */}
      {!locked && wrongPicks.length === 0 && (
        <p className="text-center text-xs text-slate-600">
          אין נכון ולא נכון שאפשר לנחש — מה שחשוב זה שתחליט לפני שתראה.
        </p>
      )}

      {/* Mid-step: they missed, the step is still open, and the answer is still
          hidden. Rose text on rose tint, not the slate used above, because this
          line has to read as feedback rather than as instructions. */}
      {!locked && wrongPicks.length > 0 && (
        <p className="rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2 text-center text-xs font-bold text-rose-800">
          לא זו. {triesLeft === 1 ? 'נשאר לך ניסיון אחד' : `נשארו לך ${triesLeft} ניסיונות`} — תסתכל שוב על מה שכבר יצא לך ובחר.
        </p>
      )}
    </div>
  );
}
