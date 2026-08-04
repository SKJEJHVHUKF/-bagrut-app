'use client';

// CommitPrompt — the gate. Nothing past this renders until the student takes
// a position.
//
// Once committed the options LOCK and colour: the correct one emerald, the
// chosen-wrong one rose, the rest dimmed. That is the same visual language
// QuestionRunnerCard already uses for MCQ, so a student who has practised in
// this app reads it without being taught.
//
// There is no retry. Committing is a position, not an attempt — a retry would
// turn "what do you think happens next" into "guess until the green one".

import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { buttonTap } from '@/lib/animations';
import type { GhostOption } from '@/content/ghost-replay/types';

const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה'];

export function CommitPrompt({
  question,
  options,
  committedOptionId,
  onCommit,
}: {
  question: string;
  options: GhostOption[];
  /** null while the student is still thinking. */
  committedOptionId: string | null;
  onCommit: (optionId: string) => void;
}) {
  const locked = committedOptionId !== null;

  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.05] p-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-700">
          עצור — תתחייב לפני שתראה
        </div>
        <div className="chat-md math-content mt-1 text-[15px] font-bold leading-relaxed text-slate-900">
          <MathText>{question}</MathText>
        </div>
      </div>

      <div className="space-y-2">
        {options.map((option, i) => {
          const isChosen = committedOptionId === option.id;
          let cls =
            'bg-slate-900/[0.03] hover:bg-slate-900/[0.06] border-slate-900/10 text-slate-900';
          if (locked && option.isCorrect) {
            cls = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900';
          } else if (isChosen) {
            cls = 'bg-rose-500/15 border-rose-500/50 text-rose-900';
          } else if (locked) {
            cls = 'bg-slate-900/[0.02] border-slate-900/[0.06] text-slate-400';
          }

          return (
            <motion.button
              key={option.id}
              {...buttonTap}
              onClick={() => onCommit(option.id)}
              disabled={locked}
              className={`flex w-full items-start gap-2 rounded-xl border px-4 py-3 text-right text-sm transition-colors disabled:cursor-default ${cls}`}
            >
              <span className="mt-0.5 flex-shrink-0 font-bold opacity-60">{LETTERS[i]}.</span>
              <span className="chat-md math-content min-w-0 flex-1">
                <MathText inline>{option.text}</MathText>
              </span>
              {locked && option.isCorrect && (
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
              )}
              {locked && isChosen && !option.isCorrect && (
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" />
              )}
            </motion.button>
          );
        })}
      </div>

      {!locked && (
        <p className="text-center text-[11px] text-slate-400">
          אין נכון ולא נכון שאפשר לנחש — מה שחשוב זה שתחליט לפני שתראה.
        </p>
      )}
    </div>
  );
}
