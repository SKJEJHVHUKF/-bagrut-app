'use client';

// RoadmapLevelRunner — plays one practice rung (easy / mid / hard) as a
// sequence of QuestionRunnerCards, then decides PASS / FAIL against the mastery
// bar. Passing clears the rung; failing never re-locks it — it offers a retry
// over just the missed questions, and after two attempts a "continue anyway"
// escape so the hardest rung can't dead-end the climb.

import { useEffect, useState } from 'react';
import { orderQuestions, studentTier } from '@/lib/adaptive';
import { retrySet } from '@/lib/roadmap-mastery';
import type { RoadmapLevel } from '@/lib/roadmap-levels';
import type { AttemptResult } from '@/lib/roadmap-progress';
import type { PracticeQuestion } from '@/content/lessons/types';
import { QuestionRunnerCard } from './QuestionRunnerCard';
import { LevelClearedPanel, LevelFailedPanel } from './ladder-ui';

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
}) {
  const total = level.questions.length;

  // The full question list, ordered once for the student's tier. Constant across
  // retries (retrySet filters it by the missed ids).
  const [orderedFull, setOrderedFull] = useState<PracticeQuestion[]>(level.questions);
  const [pool, setPool] = useState<PracticeQuestion[]>(level.questions); // current round
  const [pos, setPos] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundWrong, setRoundWrong] = useState<Set<string>>(new Set());
  const [baseCorrect, setBaseCorrect] = useState(0); // cumulative from prior rounds
  const [isRetry, setIsRetry] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);

  // Order for the student's tier on mount; this also (re)starts the first round.
  useEffect(() => {
    const ordered = orderQuestions(level.questions, studentTier(subject, topic, subId));
    setOrderedFull(ordered);
    setPool(ordered);
    setPos(0);
    setRoundCorrect(0);
    setRoundWrong(new Set());
    setBaseCorrect(0);
    setIsRetry(false);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, topic, subId, level]);

  if (total === 0) {
    return <div className="text-sm text-slate-500 text-center py-6">אין תרגילים ברמה הזו.</div>;
  }

  function handleResolved(correct: boolean) {
    const q = pool[pos];
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
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
          → לסולם
        </button>
        <span className="font-black text-indigo-700">
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
        onResolved={handleResolved}
        onBackToLearn={onBackToLearn}
      />
    </div>
  );
}
