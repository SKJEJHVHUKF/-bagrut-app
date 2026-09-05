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

import { useEffect, useMemo, useState } from 'react';
import { publishTutorFocus, FOCUS_PRIORITY } from '@/lib/tutor-presence';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, Sparkles, XCircle } from 'lucide-react';
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
  triesLeft,
  wrongPicksNow,
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
  // How many times the walkthrough has been restarted. Feeds the option seed:
  // without it a replay re-uses the SAME permutation, and since the correct
  // option was already painted emerald on the first pass, the replay button
  // turned any score into a free 3-star run on positional memory alone.
  const [attempt, setAttempt] = useState(0);
  const isReplay = attempt > 0;

  const step = replay ? currentStep(state, replay) : null;
  const branch = replay ? activeBranch(state, replay) : null;
  const prog = useMemo(
    () => (replay ? progress(state, replay) : null),
    [state, replay],
  );

  // ===== publish the replay's prompt =====
  // A walkthrough is a question the student is reasoning through, even though
  // they never type an answer. Without this the tutor could not tell the 🧠
  // rung is on screen at all.
  //
  // ⚠️ ABOVE the early return. Hooks must run in the same order on every
  // render, and this effect first landed inside the `!replay` branch — where
  // it would be skipped whenever a replay DID exist, which is every case that
  // matters.
  useEffect(() => {
    if (!replay?.prompt) return;
    publishTutorFocus(
      'ghost-replay',
      { where: 'הליכה בתוך החשיבה', questionText: replay.prompt },
      FOCUS_PRIORITY.question,
    );
    return () => publishTutorFocus('ghost-replay', null);
  }, [replay]);

  if (!replay || !prog) {
    return (
      <div className="space-y-3">
        <button onClick={onBack} className="text-[11px] text-slate-500 hover:text-slate-800">
          → לסולם
        </button>
        <div className="surface-premium rounded-2xl p-6 text-center text-sm text-slate-600">
          אין עדיין הליכת חשיבה לתת-הנושא הזה.
        </div>
      </div>
    );
  }

  function handleAdvance() {
    // `advance()` on an already-done state returns that same state, and
    // `isComplete` is still true for it — so a second call would submit the
    // rung a second time. Today only the button unmounting prevents that;
    // this makes it structural instead of incidental.
    if (isComplete(state)) return;
    const next = advance(state, replay);
    setState(next);
    if (isComplete(next)) {
      setResult(onSubmit(next.firstTryCorrect, replay.steps.length, { viaRetry: isReplay }));
    }
  }

  function restart() {
    setState(initGhost());
    setResult(null);
    setAttempt((n) => n + 1);
  }

  const done = isComplete(state);
  // `advance()` deliberately does NOT increment stepIndex on the last step — it
  // only flips the phase to 'done' — so on completion stepIndex still points at
  // the final step. Slicing to stepIndex would then drop the LAST reveal, which
  // is the answer to the whole problem: the student finishes the walkthrough and
  // the result they worked five steps for is not on the screen.
  const completedSteps = done ? replay.steps : replay.steps.slice(0, state.stepIndex);

  return (
    <div className="space-y-4">
      {/* The problem, ACTUALLY always visible.
          It used to be a plain card at the top: by step 3 the trail of walked
          steps had pushed it off screen, and the student had to scroll up to
          re-read the question they were answering. Sticking it under the
          PracticeShell strip (top-0 mobile / top-16 desktop, plus its own
          height) keeps it on screen for the whole walkthrough. Opaque
          background — the trail scrolls underneath it. */}
      <div className="sticky top-[58px] md:top-[104px] z-30 rounded-3xl border border-violet-500/25 bg-[var(--background)]/95 backdrop-blur-md p-4 shadow-sm max-h-[40vh] overflow-y-auto">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-violet-700">
          <Brain className="h-3 w-3 flex-shrink-0" />
          <span>הליכת חשיבה</span>
        </div>
        <div className="chat-md math-content mt-1.5 text-[15px] font-bold leading-relaxed text-slate-900">
          <MathText>{replay.prompt}</MathText>
        </div>
        {/* slate-500 clears AA on bare ivory (4.68:1) but NOT on this
            indigo/violet-tinted card, where it measured 4.20:1. The tint is
            what pushes it under, so the text has to go darker here. */}
        <p className="mt-2 text-xs leading-snug text-slate-600">
          לא מוצג כאן פתרון. בכל צעד תתחייב למה שאתה חושב שקורה, ורק אז תראה.
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-l from-cyan-700 to-violet-600"
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
              {/* Different GLYPH, not just a different colour: slate-300 on a
                  white row is ~1.5:1, so a colour-only distinction between "I
                  had this right" and "I fell into the trap here" is invisible
                  to most eyes and to all colour-blind ones. */}
              {state.commits[i]?.correct ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rose-500" />
              )}
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
            // The seed must carry REAL entropy, not just a counter. Seeds that
            // differ by one character do not decorrelate here:
            //   `<id>-<n>`  → all 5 steps got the SAME permutation; 12% of
            //                 replays would put every correct answer in slot א
            //   `<n>-<id>`  → better in aggregate, but 3 of 5 steps came out as
            //                 the IDENTITY order (p ≈ 0.02% by chance), so the
            //                 correct answer only ever landed on א or ב
            // Folding in the question text — long and completely different per
            // step — fixes it: all four slots used here, and over 600 synthetic
            // replays 26/26/24/24 with identity at its expected ~4% and 0
            // collapsed replays. Editing a question re-shuffles that step,
            // which is the same trade the question bank makes with ids.
            optionSeed={`${attempt}-${step.stepNumber}-${replay.id}-${step.commitPrompt.question}`}
            committedOptionId={state.commits[state.stepIndex]?.optionId ?? null}
            wrongPicks={wrongPicksNow(state)}
            triesLeft={triesLeft(state, replay)}
            branch={branch}
            revealed={isRevealed(state)}
            isLast={state.stepIndex === replay.steps.length - 1}
            onCommit={(id) => setState(commit(state, replay, id))}
            onAcknowledgeBranch={() => setState(acknowledgeBranch(state))}
            onAdvance={handleAdvance}
            onBack={onBack}
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

          {result ? (
            <LevelClearedPanel
              level={level}
              result={result}
              nextTitle={nextTitle}
              onNext={onNext}
              onBack={onBack}
              onReplay={restart}
            />
          ) : (
            // GhostStepCard — which owns the only "→ לסולם" — unmounts the moment
            // `done` flips, so if onSubmit ever failed to produce a result the
            // student would be left on the closing screen with nothing clickable
            // at all. `result` is set synchronously today, but a screen with no
            // way off it is not a state worth leaving to chance.
            <button
              onClick={onBack}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
            >
              חזרה לסולם הרמות
            </button>
          )}
        </div>
      )}
    </div>
  );
}
