'use client';

// GhostReplayLevel — the 🧠 "חשיבה" rung.
//
// Walks the student through the DECISIONS behind a hard question instead of
// showing its solution. Every step is a fork they have to commit to before it
// opens; picking a trap walks them down their own road until it breaks.
//
// The completed steps stay on screen as a compact trail. That is not
// decoration: by step 5 the student needs the roots that came out of step 4,
// and a walkthrough that hides its own history forces them to hold five
// results in their head — which is exactly the load the feature exists to
// remove.
//
// Nothing here writes to lib/results. The commits are formative, like
// MicroDrill — logging them under the bank question's id would fake a second
// attempt and quietly corrupt both the accuracy stats and the grade
// prediction. Only the rung's stars are persisted, through submitLevelResult.

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, Sparkles } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import type { RoadmapLevel } from '@/lib/roadmap-levels';
import type { AttemptResult } from '@/lib/roadmap-progress';
import {
  acknowledgeBranch,
  activeBranch,
  advance,
  commit,
  currentStep,
  initGhost,
  isComplete,
  isRevealed,
  progress,
  type GhostState,
} from '@/lib/ghost/machine';
import { LevelClearedPanel } from '@/components/roadmap/ladder-ui';
import { GhostStepCard } from './GhostStepCard';

export function GhostReplayLevel({
  level,
  nextTitle,
  onSubmit,
  onNext,
  onBack,
}: {
  level: RoadmapLevel;
  nextTitle?: string;
  onSubmit: (score: number, total: number, opts?: { viaRetry?: boolean; force?: boolean }) => AttemptResult;
  onNext?: () => void;
  onBack: () => void;
}) {
  // One replay per rung today; the registry allows more, so take the first.
  const replay = level.ghost[0];
  const [state, setState] = useState<GhostState>(initGhost);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isReplay, setIsReplay] = useState(false);

  const step = replay ? currentStep(state, replay) : null;
  const branch = replay ? activeBranch(state, replay) : null;
  const prog = useMemo(
    () => (replay ? progress(state, replay) : null),
    [state, replay],
  );

  if (!replay || !prog) {
    return (
      <div className="surface-premium rounded-2xl p-6 text-center text-sm text-slate-600">
        אין עדיין הליכת חשיבה לתת-הנושא הזה.
      </div>
    );
  }

  function handleAdvance() {
    const next = advance(state, replay);
    setState(next);
    if (isComplete(next)) {
      setResult(onSubmit(next.firstTryCorrect, replay.steps.length, { viaRetry: isReplay }));
    }
  }

  function restart() {
    setState(initGhost());
    setResult(null);
    setIsReplay(true);
  }

  const done = isComplete(state);
  const completedSteps = replay.steps.slice(0, state.stepIndex);

  return (
    <div className="space-y-4">
      {/* The problem, always visible */}
      <div className="rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-600/[0.07] to-violet-600/[0.07] p-5">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-700">
          <Brain className="h-3 w-3 flex-shrink-0" />
          <span>הליכת חשיבה</span>
        </div>
        <div className="chat-md math-content mt-1.5 text-[15px] font-bold leading-relaxed text-slate-900">
          <MathText>{replay.prompt}</MathText>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-slate-500">
          לא מוצג כאן פתרון. בכל צעד תתחייב למה שאתה חושב שקורה, ורק אז תראה.
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-l from-indigo-600 to-violet-600"
          initial={false}
          animate={{ width: `${Math.round(prog.ratio * 100)}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      {/* The trail of steps already walked */}
      {completedSteps.length > 0 && (
        <div className="space-y-1.5">
          {completedSteps.map((s, i) => (
            <div
              key={s.stepNumber}
              className="flex items-start gap-2 rounded-xl border border-slate-900/[0.07] bg-white/70 px-3 py-2"
            >
              <CheckCircle2
                className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${
                  state.commits[i]?.correct ? 'text-emerald-600' : 'text-slate-300'
                }`}
              />
              <div className="chat-md math-content min-w-0 flex-1 text-[12px] leading-snug text-slate-600">
                <MathText>{s.reveal}</MathText>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* The live step.
          KEYED motion.div, NOT AnimatePresence with mode="wait" — the same
          trap SubTopicLadder documents for its rungs. A "wait" exit has to
          finish before the next child mounts, and when it stalls the old step
          stays on screen while the parent has already moved on: the trail
          grows a row, the header still says "step 1", and the walkthrough is
          stuck. Caught live on step 2. A key change remounts cleanly. */}
      {step && !done && (
        <motion.div
          key={state.stepIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <GhostStepCard
            step={step}
            stepNumber={prog.stepNumber}
            totalSteps={prog.totalSteps}
            committedOptionId={state.commits[state.stepIndex]?.optionId ?? null}
            branch={branch}
            revealed={isRevealed(state)}
            isLast={state.stepIndex === replay.steps.length - 1}
            onCommit={(id) => setState(commit(state, replay, id))}
            onAcknowledgeBranch={() => setState(acknowledgeBranch(state))}
            onAdvance={handleAdvance}
          />
        </motion.div>
      )}

      {/* Closing + rung result */}
      {done && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 p-5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <Sparkles className="h-3 w-3 flex-shrink-0" />
              <span>מה לקחת מכאן</span>
            </div>
            <div className="chat-md math-content mt-1.5 text-sm leading-relaxed text-slate-800">
              <MathText>{replay.closing}</MathText>
            </div>
            <div className="mt-3 text-[12px] font-bold text-slate-600">
              התחייבת נכון ב-{prog.score} מתוך {prog.total} הצמתים.
            </div>
          </div>

          {result && (
            <LevelClearedPanel
              level={level}
              result={result}
              nextTitle={nextTitle}
              onNext={onNext}
              onBack={onBack}
              onReplay={restart}
            />
          )}
        </div>
      )}
    </div>
  );
}
