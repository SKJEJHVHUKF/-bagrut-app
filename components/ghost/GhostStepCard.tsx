'use client';

// GhostStepCard — one step of the walkthrough.
//
// ORDER IS THE WHOLE DESIGN:
//
//   before committing   step title · examiner-trap WARNING · the commit prompt
//   after committing    the failure branch (if they took one) → the thinking
//                       (`coreLogic`) and what actually comes out (`reveal`)
//
// `coreLogic` is on the REVEALED side on purpose. It is the reasoning that
// leads to the right choice — showing it above the prompt would hand over the
// answer and turn the commit into a formality. The trap badge stays above,
// because a warning after the choice is a post-mortem, and it is written to
// say "danger here" without saying which option is safe.

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, Sparkles } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { buttonTap } from '@/lib/animations';
import type { GhostBranch, GhostReplayStep } from '@/content/ghost-replay/types';
import { CommitPrompt } from './CommitPrompt';
import { ExaminerTrapBadge } from './ExaminerTrapBadge';
import { FailureBranch } from './FailureBranch';

export function GhostStepCard({
  step,
  stepNumber,
  totalSteps,
  optionSeed,
  committedOptionId,
  branch,
  revealed,
  isLast,
  onCommit,
  onAcknowledgeBranch,
  onAdvance,
  onBack,
}: {
  step: GhostReplayStep;
  stepNumber: number;
  totalSteps: number;
  /** Seeds the deterministic option order — unique per replay AND per step. */
  optionSeed: string;
  committedOptionId: string | null;
  /** Non-null only while the student is reading their own wrong road. */
  branch: GhostBranch | null;
  revealed: boolean;
  isLast: boolean;
  onCommit: (optionId: string) => void;
  onAcknowledgeBranch: () => void;
  onAdvance: () => void;
  /** Back to the ladder — the same escape every other rung offers. */
  onBack: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* The escape hatch. Every sibling rung (LearnLevel, BagrutLevel) offers
          "→ לסולם" while in progress; without it a student who opens a Ghost
          Replay by mistake, or wants to go back and re-read the lesson, is
          trapped — the only way out is the browser's back button. */}
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <button onClick={onBack} className="hover:text-slate-800">
          → לסולם
        </button>
        <span className="font-bold">
          צעד {stepNumber} מתוך {totalSteps}
        </span>
      </div>

      <div className="surface-premium rounded-2xl p-5">
        <div className="chat-md math-content text-base font-black leading-snug text-slate-900">
          <MathText inline>{step.title}</MathText>
        </div>
      </div>

      {/* Only before the commit. Once revealed, `coreLogic` and the failure
          branch carry the specifics, and repeating a deliberately vague
          warning underneath them would add noise, not reinforcement. */}
      {step.examinerTrap && !revealed && !branch && (
        <ExaminerTrapBadge
          warning={step.examinerTrap.warning}
          description={step.examinerTrap.description}
        />
      )}

      <CommitPrompt
        question={step.commitPrompt.question}
        options={step.commitPrompt.options}
        seed={optionSeed}
        committedOptionId={committedOptionId}
        onCommit={onCommit}
      />

      {branch && (
        <FailureBranch branch={branch} onAcknowledge={revealed ? null : onAcknowledgeBranch} />
      )}

      <AnimatePresence initial={false}>
        {revealed && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
            className="space-y-3"
          >
            <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-600/[0.07] to-violet-600/[0.07] p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-violet-700">
                <Lightbulb className="h-3 w-3 flex-shrink-0" />
                <span>מה עובר לו בראש</span>
              </div>
              <div className="chat-md math-content mt-1.5 text-sm leading-relaxed text-slate-800">
                <MathText>{step.coreLogic}</MathText>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.08] px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                ומה יוצא מזה
              </div>
              <div className="chat-md math-content mt-0.5 text-sm font-medium leading-relaxed text-emerald-950">
                <MathText>{step.reveal}</MathText>
              </div>
            </div>

            <motion.button
              {...buttonTap}
              onClick={onAdvance}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
            >
              {isLast ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>סיים את ההליכה</span>
                </>
              ) : (
                <>
                  <span>הצעד הבא</span>
                  <ArrowLeft className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
