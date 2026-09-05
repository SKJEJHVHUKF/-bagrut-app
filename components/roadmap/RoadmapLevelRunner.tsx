'use client';

// RoadmapLevelRunner — plays one practice rung (easy / mid / hard) as a
// sequence of QuestionRunnerCards, then decides PASS / FAIL against the mastery
// bar. Passing clears the rung; failing never re-locks it — it offers a retry
// over just the missed questions, and after two attempts a "continue anyway"
// escape so the hardest rung can't dead-end the climb.

import { useCallback, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { orderQuestions, studentTier } from '@/lib/adaptive';
import { retrySet } from '@/lib/roadmap-mastery';
import type { RoadmapLevel } from '@/lib/roadmap-levels';
import type { AttemptResult } from '@/lib/roadmap-progress';
import type { PracticeQuestion } from '@/content/lessons/types';
import { QuestionRunnerCard, type AnswerSnapshot } from './QuestionRunnerCard';
import { LevelClearedPanel, LevelFailedPanel } from './ladder-ui';
import { useClientValue } from '@/lib/use-client-value';

export function RoadmapLevelRunner({
  subject,
  topic,
  subId,
  level,
  onSubmit,
  nextTitle,
  onNext,
  onBack,
  onBackToLearn,
  subTopicTitle,
}: {
  subject: string;
  topic: string;
  subId: string;
  level: RoadmapLevel;
  /** Grade a completed play against the mastery bar and persist it. */
  onSubmit: (score: number, total: number, opts?: { viaRetry?: boolean; force?: boolean }) => AttemptResult;
  nextTitle?: string;
  onNext?: () => void;
  onBack: () => void;
  onBackToLearn?: () => void;
  /** For the share card on mastery / core-done. */
  subTopicTitle?: string;
}) {
  const total = level.questions.length;

  // The full question list, ordered once for the student's tier. Constant across
  // retries (retrySet filters it by the missed ids).
  // studentTier reads localStorage, so the ordering does not exist during the
  // server render — until hydration the questions stand in their authored order.
  const readOrdered = useCallback(
    () => orderQuestions(level.questions, studentTier(subject, topic, subId)),
    [subject, topic, subId, level],
  );
  const orderedFull = useClientValue<PracticeQuestion[]>(readOrdered, level.questions);
  const [pool, setPool] = useState<PracticeQuestion[]>(level.questions); // current round
  const [pos, setPos] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundWrong, setRoundWrong] = useState<Set<string>>(new Set());
  const [baseCorrect, setBaseCorrect] = useState(0); // cumulative from prior rounds
  const [isRetry, setIsRetry] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  /** What the student answered, per question id. Feeds the back button: a
   *  revisited question is re-rendered from its snapshot instead of coming back
   *  blank, and is never scored or logged a second time. */
  const [answers, setAnswers] = useState<Record<string, AnswerSnapshot>>({});

  // A new ordering means a new level (or a newly-known tier) — restart the run.
  // Adjusted during render rather than in an effect so the stale round is never
  // committed: React re-runs this component with the reset state immediately.
  const [shownOrder, setShownOrder] = useState(orderedFull);
  if (shownOrder !== orderedFull) {
    setShownOrder(orderedFull);
    setPool(orderedFull);
    setPos(0);
    setRoundCorrect(0);
    setRoundWrong(new Set());
    setBaseCorrect(0);
    setIsRetry(false);
    setResult(null);
    setAnswers({});
  }

  if (total === 0) {
    return <div className="text-sm text-slate-500 text-center py-6">אין תרגילים ברמה הזו.</div>;
  }

  function handleResolved(correct: boolean, snapshot: AnswerSnapshot) {
    const q = pool[pos];

    // Re-answering a question reached through the back button must not score it
    // twice. The FIRST pass is the one that counts, exactly as before.
    if (answers[q.id]) {
      if (pos + 1 < pool.length) setPos(pos + 1);
      else setResult(onSubmit(baseCorrect + roundCorrect, total, { viaRetry: isRetry }));
      return;
    }
    setAnswers({ ...answers, [q.id]: snapshot });

    const nextCorrect = roundCorrect + (correct ? 1 : 0);
    const nextWrong = new Set(roundWrong);
    if (!correct) nextWrong.add(q.id);
    setRoundCorrect(nextCorrect);
    setRoundWrong(nextWrong);

    if (pos + 1 < pool.length) {
      setPos(pos + 1);
    } else {
      // End of the round → grade the whole rung.
      const cumulative = baseCorrect + nextCorrect;
      setResult(onSubmit(cumulative, total, { viaRetry: isRetry }));
    }
  }

  function startRetry() {
    setBaseCorrect(baseCorrect + roundCorrect); // the ones already right carry over
    setPool(retrySet(orderedFull, roundWrong));
    setPos(0);
    setRoundCorrect(0);
    setRoundWrong(new Set());
    setIsRetry(true);
    setResult(null);
    setAnswers({}); // the missed questions are being answered again, for score
  }

  function continueAnyway() {
    setResult(onSubmit(baseCorrect + roundCorrect, total, { force: true }));
  }

  function replay() {
    setPool(orderedFull);
    setPos(0);
    setRoundCorrect(0);
    setRoundWrong(new Set());
    setBaseCorrect(0);
    setIsRetry(false);
    setResult(null);
    setAnswers({});
  }

  // ===== Result: cleared or failed =====
  if (result) {
    if (result.passed) {
      return (
        <LevelClearedPanel
          level={level}
          result={result}
          nextTitle={nextTitle}
          onNext={onNext}
          subTopicTitle={subTopicTitle}
          onBack={onBack}
          onReplay={result.stars < 3 ? replay : undefined}
          />
      );
    }
    return (
      <LevelFailedPanel
        level={level}
        score={result.score}
        total={result.total}
        required={result.requiredCorrect}
        missedCount={roundWrong.size}
        attempts={result.attempts}
        onRetry={startRetry}
        onContinueAnyway={continueAnyway}
        onBackToLearn={onBackToLearn}
        onBack={onBack}
      />
    );
  }

  // ===== Active question =====
  const current = pool[pos];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
            → לסולם
          </button>
          {/* Owner, 2026-09-05: "תעשה שיהיה אפשר לחזור אחורה בשאלות". The rung
              used to move forward only, so a student who wanted to re-read a
              question they had just answered had no way back to it. */}
          {pos > 0 && (
            <button
              onClick={() => setPos(pos - 1)}
              className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-bold"
            >
              <ArrowRight className="w-3.5 h-3.5" /> לשאלה הקודמת
            </button>
          )}
        </div>
        <span className="font-black text-violet-700">
          {level.emoji} רמת {level.title}
          {isRetry ? ' · חזרה על הטעויות' : ''}
        </span>
      </div>

      <QuestionRunnerCard
        key={`${isRetry ? 'r' : 'p'}-${pos}-${current.id}`}
        question={current}
        position={pos + 1}
        total={pool.length}
        subject={subject}
        topic={topic}
        subId={subId}
        source="drill"
        saved={answers[current.id] ?? null}
        onResolved={handleResolved}
        onBackToLearn={onBackToLearn}
      />
    </div>
  );
}
