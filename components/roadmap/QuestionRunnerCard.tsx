'use client';

// QuestionRunnerCard — ONE practice question with a REAL feedback loop.
// Used by the ladder practice rungs (easy/mid/hard) and by the daily review.
//
// The old runner just coloured the right MCQ option green and moved on — a
// wrong answer taught nothing. Here every wrong answer opens a graded ladder of
// help: an auto-revealed hint → ONE free retry (the first attempt is what
// counts) → the full worked solution + final answer + "why it works" →
// mistake tagging → an optional AI "why did I get it wrong?". Open questions
// with a machine-checkable `expected` spec are graded deterministically ($0)
// via lib/answer-check; the rest fall back to reveal-and-self-report.

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb, KeyRound, LifeBuoy, ArrowLeft, RotateCcw } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { AnswerInput } from '@/components/practice/AnswerInput';
import { MistakeTagger } from '@/components/practice/MistakeTagger';
import { AITutorActions } from '@/components/practice/AITutorActions';
import { buttonTap } from '@/lib/animations';
import { celebrateCorrect } from '@/lib/confetti';
import { seededOrder } from '@/lib/shuffle';
import { checkAnswer, type CheckResult } from '@/lib/answer-check';
import { recordResult, type ResultSource } from '@/lib/results';
import { recordMistake } from '@/lib/mistakes';
import type { ErrorCategory } from '@/lib/mistakes';
import { seedFromMiss, gradeReview } from '@/lib/review';
import type { PracticeQuestion } from '@/content/lessons/types';

const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה'];

export function QuestionRunnerCard({
  question,
  position,
  total,
  subject,
  topic,
  subId,
  source,
  onResolved,
  onBackToLearn,
}: {
  question: PracticeQuestion;
  /** 1-based position in the rung. */
  position: number;
  total: number;
  subject: string;
  topic: string;
  subId: string;
  source: ResultSource;
  /** Called once, when the student presses "next" — `firstTryCorrect` is what
   *  the rung scores on. */
  onResolved: (firstTryCorrect: boolean) => void;
  onBackToLearn?: () => void;
}) {
  const q = question;
  const autoGradable = q.kind === 'open' && !!q.expected && q.expected.kind !== 'manual';

  // Deterministic per-question option order (seeded by id), SSR-safe + stable.
  const order = useMemo(
    () => (q.kind === 'mcq' ? seededOrder(q.answers?.length ?? 0, q.id) : []),
    [q],
  );

  const [selected, setSelected] = useState<number | null>(null); // MCQ original index
  const [input, setInput] = useState('');
  const [tries, setTries] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState<boolean | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [mistakeId, setMistakeId] = useState<string | null>(null);
  const [aiCategory, setAiCategory] = useState<ErrorCategory | null>(null);

  const resolved = revealed || firstTryCorrect === true;

  // Log the FIRST attempt exactly once (that's the measured one). Wrong first
  // attempts also seed the error notebook and give us a mistakeId to tag.
  function logFirst(correct: boolean, userAnswer?: string) {
    recordResult({ subject, topic, subTopicId: subId, questionId: q.id, source, difficulty: q.difficulty, correct });
    // Spaced repetition: a review answer re-schedules the card; a fresh miss in
    // a practice rung drops the question into the review queue (box 1).
    if (source === 'review') gradeReview(q.id, correct);
    else if (!correct) seedFromMiss({ subject, topic, subTopicId: subId, questionId: q.id });
    if (!correct) {
      const id = recordMistake({
        subject,
        topic,
        subTopicId: subId,
        questionId: q.id,
        questionText: q.question,
        userAnswer,
        correctAnswer: q.solution.finalAnswer,
        category: 'אחר',
        source,
      });
      setMistakeId(id);
    }
  }

  function gradeCorrect() {
    celebrateCorrect();
    setRevealed(true);
  }

  // Wrong: on the FIRST miss offer one free retry (with the hint); on the
  // second, reveal the full solution.
  function gradeWrong() {
    setHintShown(true);
    if (tries >= 2) setRevealed(true);
  }

  function pickMCQ(origIdx: number) {
    if (resolved) return;
    const correct = origIdx === q.correct;
    const nextTries = tries + 1;
    setTries(nextTries);
    setSelected(origIdx);
    if (nextTries === 1) {
      setFirstTryCorrect(correct);
      logFirst(correct, q.answers?.[origIdx]);
    }
    if (correct) gradeCorrect();
    else gradeWrong();
  }

  function retryMCQ() {
    setSelected(null); // let them pick again (they haven't seen the correct one)
  }

  function submitOpen() {
    if (resolved || !q.expected || q.expected.kind === 'manual') return;
    const res = checkAnswer(input, q.expected);
    setCheck(res);
    // Unparseable is NOT a wrong answer — ask them to rewrite it, don't punish.
    if (res.verdict === 'unparseable' || res.verdict === 'manual') return;
    const correct = res.verdict === 'correct';
    const nextTries = tries + 1;
    setTries(nextTries);
    if (nextTries === 1) {
      setFirstTryCorrect(correct);
      logFirst(correct, input);
    }
    if (correct) gradeCorrect();
    else gradeWrong();
  }

  function retryOpen() {
    setCheck(null); // keep the input so they can edit it
  }

  // Self-report path (open questions with no machine-checkable spec).
  function selfReport(correct: boolean) {
    if (firstTryCorrect !== null) return;
    setFirstTryCorrect(correct);
    logFirst(correct, input || undefined);
    setRevealed(true);
    if (correct) celebrateCorrect();
  }

  const wrong = firstTryCorrect === false;

  return (
    <div className="space-y-3">
      {/* Progress header */}
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span className="font-bold">שאלה {position} מתוך {total}</span>
        {q.difficulty && (
          <span className="text-slate-400">
            {q.difficulty === 'easy' ? 'קל' : q.difficulty === 'mid' ? 'בינוני' : 'מאתגר'}
          </span>
        )}
      </div>

      {/* 1 · The question */}
      <div className="surface-premium rounded-2xl p-5 chat-md">
        <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1.5">השאלה</div>
        <div className="text-base font-medium leading-relaxed text-slate-900">
          <MathText>{q.question}</MathText>
        </div>
      </div>

      {/* 2 · MCQ options */}
      {q.kind === 'mcq' && q.answers && (
        <div className="space-y-2">
          {order.map((origIdx, i) => {
            const isCorrect = origIdx === q.correct;
            const isSelected = selected === origIdx;
            let cls = 'bg-slate-900/[0.03] hover:bg-slate-900/5 border-slate-900/10 text-slate-900';
            if (revealed && isCorrect) cls = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900';
            else if (isSelected && !isCorrect) cls = 'bg-rose-500/15 border-rose-500/50 text-rose-800';
            else if (revealed) cls = 'bg-slate-900/[0.02] border-slate-900/[0.06] text-slate-500';
            return (
              <motion.button
                key={origIdx}
                {...buttonTap}
                onClick={() => pickMCQ(origIdx)}
                disabled={resolved || selected !== null}
                className={`w-full text-right px-4 py-3 rounded-xl border transition-colors chat-md text-sm ${cls}`}
              >
                <span className="font-bold opacity-60 ml-2">{LETTERS[i]}.</span>
                <MathText inline>{q.answers![origIdx]}</MathText>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* 2 · Open answer — auto-graded when the question carries an `expected` spec */}
      {q.kind === 'open' && autoGradable && !revealed && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-600">התשובה שלך:</div>
          <AnswerInput value={input} onChange={setInput} type="expression" disabled={firstTryCorrect === true} />
          {check?.verdict === 'unparseable' && (
            <div className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              לא הצלחתי לקרוא את התשובה — נסה לכתוב אותה כמספר או ביטוי (למשל <span dir="ltr">2+3i</span> או <span dir="ltr">x&gt;4</span>).
            </div>
          )}
          {check && check.verdict !== 'unparseable' && check.readAs && (
            <div className="text-[11px] text-slate-500">
              קראתי את התשובה שלך כ־<span dir="ltr" className="font-mono">{check.readAs}</span>
            </div>
          )}
          <motion.button
            {...buttonTap}
            onClick={submitOpen}
            disabled={!input.trim()}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 px-4 py-2.5 rounded-xl font-bold text-white text-sm transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>בדוק תשובה</span>
          </motion.button>
        </div>
      )}

      {/* 2 · Open answer — no machine-checkable spec → solve on paper, self-report */}
      {q.kind === 'open' && !autoGradable && !revealed && (
        <button
          onClick={() => { setRevealed(true); setHintShown(true); }}
          className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/40 px-4 py-3 rounded-xl font-bold text-indigo-800 text-sm transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          <span>פתרתי על דף — הצג פתרון להשוואה</span>
        </button>
      )}

      {/* Wrong-first feedback: hint + one free retry (before the full solution) */}
      <AnimatePresence initial={false}>
        {hintShown && !revealed && wrong && (
          <motion.div
            key="retry"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {q.hint && (
              <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl px-3 py-2.5 chat-md">
                <div className="text-[10px] font-black tracking-widest text-amber-700 mb-1 uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-3 h-3" /> רמז
                </div>
                <div className="text-sm text-amber-900"><MathText>{q.hint}</MathText></div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <motion.button
                {...buttonTap}
                onClick={q.kind === 'mcq' ? retryMCQ : retryOpen}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 px-4 py-2.5 rounded-xl font-bold text-amber-800 text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> נסה שוב
              </motion.button>
              <motion.button
                {...buttonTap}
                onClick={() => setRevealed(true)}
                className="inline-flex items-center justify-center gap-2 bg-slate-900/[0.04] hover:bg-slate-900/[0.07] border border-slate-900/10 px-4 py-2.5 rounded-xl font-bold text-slate-600 text-sm transition-colors"
              >
                הצג פתרון
              </motion.button>
            </div>
            <div className="text-[10px] text-slate-400 text-center">
              הניסיון הראשון כבר נספר — הניסיון הנוסף הוא בשבילך, ללמוד.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Correct banner */}
      {revealed && firstTryCorrect === true && (
        <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
          <CheckCircle className="w-4 h-4" /> בדיוק! כל הכבוד.
        </div>
      )}

      {/* Full solution — steps + final answer + why it works */}
      <AnimatePresence initial={false}>
        {revealed && (
          <motion.div
            key="solution"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
            className="space-y-3"
          >
            {wrong && (
              <div className="flex items-center gap-1.5 text-sm font-bold text-rose-700">
                <XCircle className="w-4 h-4" /> לא נורא — ככה פותרים, שלב אחר שלב:
              </div>
            )}
            <div className="bg-gradient-to-br from-indigo-600/[0.07] to-violet-600/[0.07] border border-indigo-500/25 rounded-2xl p-4">
              <div className="text-[10px] font-black tracking-widest text-indigo-700 mb-2 uppercase flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" /> פתרון
              </div>
              <ol className="space-y-2">
                {q.solution.steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-[10px] font-black text-indigo-800">
                      {i + 1}
                    </div>
                    <div className="flex-1 chat-md text-sm text-slate-800 pt-0.5"><MathText>{step}</MathText></div>
                  </li>
                ))}
              </ol>
              <div className="mt-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2">
                <div className="text-[10px] font-black tracking-widest text-emerald-700 mb-0.5 uppercase">תשובה סופית</div>
                <div className="text-sm font-bold text-emerald-900 chat-md"><MathText inline>{q.solution.finalAnswer}</MathText></div>
              </div>
              {q.solution.explanation && (
                <div className="mt-2 bg-sky-500/[0.06] border border-sky-500/25 rounded-lg px-3 py-2">
                  <div className="text-[10px] font-black tracking-widest text-sky-700 mb-0.5 uppercase">למה זה עובד</div>
                  <div className="text-xs text-slate-700 chat-md leading-relaxed"><MathText>{q.solution.explanation}</MathText></div>
                </div>
              )}
            </div>

            {/* Self-report for un-gradable open questions */}
            {q.kind === 'open' && !autoGradable && firstTryCorrect === null && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selfReport(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-4 py-2.5 rounded-xl font-bold text-emerald-800 text-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> פתרתי נכון
                </button>
                <button
                  onClick={() => selfReport(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 px-4 py-2.5 rounded-xl font-bold text-rose-800 text-sm transition-colors"
                >
                  <XCircle className="w-4 h-4" /> עוד לא
                </button>
              </div>
            )}

            {/* When they got it wrong: tag the mistake + optional AI "why?" */}
            {wrong && firstTryCorrect !== null && (
              <>
                {mistakeId && (
                  <MistakeTagger mistakeId={mistakeId} initial={aiCategory} />
                )}
                <AITutorActions
                  question={q.question}
                  correctAnswer={q.solution.finalAnswer}
                  userAnswer={q.kind === 'mcq' ? (selected !== null ? q.answers?.[selected] : undefined) : input || undefined}
                  solution={q.solution.steps.join('\n')}
                  hints={q.hint ? [q.hint] : undefined}
                  topic={topic}
                  difficulty={q.difficulty}
                  show={{ whyWrong: true }}
                  onCategory={(c) => setAiCategory(c as ErrorCategory)}
                />
              </>
            )}

            {onBackToLearn && wrong && (
              <button
                onClick={onBackToLearn}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-800 hover:text-sky-600 transition-colors"
              >
                <LifeBuoy className="w-3.5 h-3.5" /> נתקעת? חזור להסבר של השלב <ArrowLeft className="w-3 h-3" />
              </button>
            )}

            {/* Move on — only enabled once the question is truly resolved. */}
            {(firstTryCorrect !== null) && (
              <motion.button
                {...buttonTap}
                onClick={() => onResolved(firstTryCorrect === true)}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 px-4 py-3 rounded-xl font-black text-white text-sm transition-colors"
              >
                <span>{position >= total ? 'סיים את הרמה' : 'השאלה הבאה'}</span>
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
