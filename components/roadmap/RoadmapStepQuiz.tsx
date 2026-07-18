'use client';

// RoadmapStepQuiz — the "בוחן שלב" tab. 3 hyper-targeted questions drawn from
// the sub-topic's STATIC bank (no API). Pass 2 of 3 → the node is completed,
// the next node in the topic unlocks, and we celebrate. MCQ auto-grades;
// open questions reveal the solution and the student self-reports.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, RefreshCw, ArrowLeft, KeyRound } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { buttonTap } from '@/lib/animations';
import { celebrateCorrect, celebrateCompletion } from '@/lib/confetti';
import { recordResult } from '@/lib/results';
import { recordMistake } from '@/lib/mistakes';
import { markNodePassed, PASS_NUMERATOR } from '@/lib/roadmap-progress';
import type { PracticeQuestion } from '@/content/lessons/types';

const LETTERS = ['א', 'ב', 'ג', 'ד'];

export function RoadmapStepQuiz({
  subject,
  topic,
  subId,
  questions,
  nextSubId,
  nextTitle,
  onPassed,
}: {
  subject: string;
  topic: string;
  subId: string;
  questions: PracticeQuestion[];
  nextSubId: string | null;
  nextTitle?: string;
  onPassed?: () => void;
}) {
  // Prefer MCQ (auto-gradeable), fill with open, take 3.
  const quizQs = useMemo(() => {
    const mcqs = questions.filter((q) => q.kind === 'mcq' && Array.isArray(q.answers));
    const opens = questions.filter((q) => q.kind === 'open');
    return [...mcqs, ...opens].slice(0, 3);
  }, [questions]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [openRevealed, setOpenRevealed] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [passed, setPassed] = useState(false);

  const total = quizQs.length;
  const current = quizQs[idx];
  const isLast = idx === total - 1;

  function logAnswer(correct: boolean, userAnswer?: string) {
    recordResult({ subject, topic, subTopicId: subId, questionId: current.id, source: 'drill', difficulty: current.difficulty, correct });
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
      const didPass = markNodePassed(topic, subId, correctCount, total);
      setPassed(didPass);
      setDone(true);
      if (didPass) {
        celebrateCompletion();
        onPassed?.();
      }
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setOpenRevealed(false);
    setAnswered(false);
  }

  function restart() {
    setIdx(0);
    setSelected(null);
    setOpenRevealed(false);
    setAnswered(false);
    setCorrectCount(0);
    setDone(false);
    setPassed(false);
  }

  if (total === 0) {
    return <div className="text-sm text-slate-500 text-center py-6">אין שאלות לשלב הזה עדיין.</div>;
  }

  // ===== Results =====
  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
        <div
          className={`rounded-3xl p-6 text-center space-y-3 border ${
            passed ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-amber-500/10 border-amber-500/40'
          }`}
        >
          <Trophy className={`w-12 h-12 mx-auto ${passed ? 'text-amber-600' : 'text-slate-400'}`} />
          <div className="text-4xl font-black text-slate-900">
            {correctCount}/{total}
          </div>
          <h3 className="font-display text-xl font-black text-slate-900">
            {passed ? 'עברת את השלב! 🎉' : 'כמעט שם'}
          </h3>
          <p className="text-sm text-slate-700">
            {passed
              ? 'השלב סומן כהושלם והשלב הבא נפתח.'
              : `צריך ${PASS_NUMERATOR} תשובות נכונות כדי לפתוח את הבא. נסה שוב — אתה קרוב.`}
          </p>
        </div>

        {passed ? (
          <div className="grid grid-cols-1 gap-2">
            {nextSubId ? (
              <Link
                href={`/roadmap/${encodeURIComponent(nextSubId)}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/30 transition-colors"
              >
                <span>המשך לשלב הבא{nextTitle ? `: ${nextTitle}` : ''}</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/roadmap"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/30"
              >
                סיימת את הנושא! חזרה למפה
              </Link>
            )}
            <Link href="/roadmap" className="text-center text-xs text-slate-600 hover:text-indigo-700 py-1">
              חזרה למפת הלמידה
            </Link>
          </div>
        ) : (
          <motion.button
            {...buttonTap}
            onClick={restart}
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 px-5 py-3 rounded-2xl font-bold text-indigo-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>נסה שוב</span>
          </motion.button>
        )}
      </motion.div>
    );
  }

  // ===== Active question =====
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-black text-indigo-700">בוחן שלב</span>
        <span className="text-slate-600">
          שאלה <span className="font-bold text-indigo-700">{idx + 1}/{total}</span> · {correctCount} נכונות
        </span>
      </div>

      <div className="surface-premium rounded-2xl p-5 chat-md">
        <div className="text-base font-medium leading-relaxed text-slate-900">
          <MathText>{current.question}</MathText>
        </div>
      </div>

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
              <span>פתרתי — הצג פתרון להשוואה</span>
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
                    <CheckCircle className="w-4 h-4" /> ידעתי
                  </button>
                  <button
                    onClick={() => reportOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 px-3 py-2 rounded-lg font-bold text-amber-800 text-sm"
                  >
                    <XCircle className="w-4 h-4" /> לא ידעתי
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {answered && (
        <motion.button
          {...buttonTap}
          onClick={next}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/30 transition-colors"
        >
          <span>{isLast ? 'סיים בוחן' : 'השאלה הבאה'}</span>
          {!isLast && <ArrowLeft className="w-4 h-4" />}
        </motion.button>
      )}
    </div>
  );
}
