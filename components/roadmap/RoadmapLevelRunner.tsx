'use client';

// RoadmapLevelRunner — runs ONE practice rung (easy / mid / hard) of a
// sub-topic's level ladder. Goes through the tier's questions one at a time
// (MCQ auto-grades; open reveals the solution + self-report), tallies the
// score, then awards 1-3 stars and reports the clear up to the ladder.

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, KeyRound, Lightbulb, ArrowLeft } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { buttonTap } from '@/lib/animations';
import { celebrateCorrect, sparkle } from '@/lib/confetti';
import { recordResult } from '@/lib/results';
import { recordMistake } from '@/lib/mistakes';
import { studentTier, orderQuestions, tierLabel, type Tier } from '@/lib/adaptive';
import { computeStars, type RoadmapLevel } from '@/lib/roadmap-levels';
import type { ClearResult } from '@/lib/roadmap-progress';
import { LevelClearedPanel } from './ladder-ui';
import type { PracticeQuestion } from '@/content/lessons/types';

const LETTERS = ['א', 'ב', 'ג', 'ד'];

export function RoadmapLevelRunner({
  subject,
  topic,
  subId,
  level,
  onCleared,
  nextTitle,
  onNext,
  onBack,
}: {
  subject: string;
  topic: string;
  subId: string;
  level: RoadmapLevel;
  onCleared: (stars: number, score: number, total: number) => ClearResult;
  nextTitle?: string;
  onNext?: () => void;
  onBack: () => void;
}) {
  // Order the tier's questions for the student's level (3/4/5 units + live
  // accuracy) — reordered once after mount (localStorage), matching the old
  // SubTopicPractice so the difficulty experience is consistent across surfaces.
  const [questions, setQuestions] = useState<PracticeQuestion[]>(level.questions);
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => {
    const t = studentTier(subject, topic, subId);
    setTier(t);
    setQuestions(orderQuestions(level.questions, t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, topic, subId, level]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [openRevealed, setOpenRevealed] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<ClearResult | null>(null);

  const total = questions.length;
  const current = questions[idx];
  const isLast = idx === total - 1;

  function logAnswer(correct: boolean, userAnswer?: string) {
    recordResult({
      subject,
      topic,
      subTopicId: subId,
      questionId: current.id,
      source: 'drill',
      difficulty: current.difficulty,
      correct,
    });
    if (!correct) {
      recordMistake({
        subject,
        topic,
        subTopicId: subId,
        questionId: current.id,
        questionText: current.question,
        userAnswer,
        correctAnswer: current.solution.finalAnswer,
        category: 'אחר',
        source: 'drill',
      });
    }
  }

  function pickMCQ(i: number) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const correct = i === current.correct;
    if (correct) {
      setCorrectCount((c) => c + 1);
      celebrateCorrect();
    }
    logAnswer(correct, current.answers?.[i]);
  }

  function reportOpen(correct: boolean) {
    if (answered) return;
    setAnswered(true);
    if (correct) {
      setCorrectCount((c) => c + 1);
      celebrateCorrect();
    }
    logAnswer(correct);
  }

  function next() {
    if (isLast) {
      const stars = computeStars(level.kind, correctCount, total);
      setResult(onCleared(stars, correctCount, total));
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setOpenRevealed(false);
    setHintShown(false);
    setAnswered(false);
  }

  if (total === 0) {
    return <div className="text-sm text-slate-500 text-center py-6">אין תרגילים ברמה הזו.</div>;
  }

  // ===== Cleared =====
  if (result) {
    return (
      <LevelClearedPanel level={level} result={result} nextTitle={nextTitle} onNext={onNext} onBack={onBack} />
    );
  }

  // ===== Active question =====
  return (
    <div className="space-y-4">
      {/* Rung header + progress */}
      <div className="flex items-center justify-between text-xs">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
          → לסולם
        </button>
        <span className="inline-flex items-center gap-2">
          <span className="font-black text-indigo-700">
            {level.emoji} רמת {level.title}
          </span>
          {tier !== null && (
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-2 py-0.5">
              {tierLabel(tier)}
            </span>
          )}
          <span className="text-slate-600">
            {idx + 1}/{total} · {correctCount} נכונות
          </span>
        </span>
      </div>
      <div className="h-1.5 bg-slate-900/[0.03] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((idx + (answered ? 1 : 0)) / total) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="h-full bg-gradient-to-l from-indigo-500 to-violet-500"
        />
      </div>

      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="surface-premium rounded-2xl p-5 chat-md"
      >
        <div className="text-base font-medium leading-relaxed text-slate-900">
          <MathText>{current.question}</MathText>
        </div>
      </motion.div>

      {/* MCQ */}
      {current.kind === 'mcq' && current.answers && (
        <div className="space-y-2">
          {current.answers.map((ans, i) => {
            const isCorrect = i === current.correct;
            let cls = 'bg-slate-900/[0.03] hover:bg-slate-900/5 border-slate-900/10 text-slate-900';
            if (answered && isCorrect) cls = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900';
            else if (answered && i === selected) cls = 'bg-rose-500/15 border-rose-500/50 text-rose-800';
            else if (answered) cls = 'bg-slate-900/[0.02] border-slate-900/[0.06] text-slate-500';
            return (
              <motion.button
                key={i}
                {...buttonTap}
                onClick={() => pickMCQ(i)}
                disabled={answered}
                className={`w-full text-right px-4 py-3 rounded-xl border transition-colors chat-md text-sm ${cls}`}
              >
                <span className="font-bold opacity-60 ml-2">{LETTERS[i]}.</span>
                <MathText inline>{ans}</MathText>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Open — reveal + self-report */}
      {current.kind === 'open' && (
        <div className="space-y-2">
          {!openRevealed ? (
            <motion.button
              {...buttonTap}
              onClick={() => setOpenRevealed(true)}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-4 py-2.5 rounded-xl font-bold text-emerald-800 text-sm transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span>פתרתי על דף — הצג פתרון להשוואה</span>
            </motion.button>
          ) : (
            <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
              <ol className="space-y-2">
                {current.solution.steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-[11px] font-black text-emerald-800">
                      {i + 1}
                    </div>
                    <div className="flex-1 chat-md text-sm text-slate-800 pt-0.5">
                      <MathText>{s}</MathText>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="result-box rounded-xl px-3 py-2.5">
                <div className="text-[10px] font-black tracking-widest text-emerald-700 uppercase mb-1">תשובה סופית</div>
                <div className="text-sm font-bold text-emerald-900 chat-md">
                  <MathText inline>{current.solution.finalAnswer}</MathText>
                </div>
              </div>
              {!answered && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => reportOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-3 py-2 rounded-lg font-bold text-emerald-800 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> פתרתי נכון
                  </button>
                  <button
                    onClick={() => reportOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 px-3 py-2 rounded-lg font-bold text-amber-800 text-sm"
                  >
                    <XCircle className="w-4 h-4" /> עוד לא
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hint (MCQ-side helper) */}
      {current.hint && !answered && (
        hintShown ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex gap-2 items-start">
            <Lightbulb className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="chat-md text-sm text-amber-900 flex-1">
              <MathText inline>{current.hint}</MathText>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setHintShown(true);
              sparkle();
            }}
            className="w-full inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-xl font-bold text-amber-800 text-sm transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span>💡 רמז</span>
          </button>
        )
      )}

      {answered && (
        <motion.button
          {...buttonTap}
          onClick={next}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/25 transition-colors"
        >
          <span>{isLast ? 'סיים את הרמה' : 'השאלה הבאה'}</span>
          {!isLast && <ArrowLeft className="w-4 h-4" />}
        </motion.button>
      )}
    </div>
  );
}
