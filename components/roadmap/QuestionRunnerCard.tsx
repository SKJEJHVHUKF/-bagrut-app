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
//
// The hint is ALSO available BEFORE committing (💡 רמז), same as /quiz and
// SubTopicPractice. It used to be reachable only after a miss — and on the
// un-gradable open path (proofs) the one button revealed the whole solution, so
// the authored hint could never render at all and the only help was the answer.
// Asking for it is not free: `hintUsed` reaches lib/cognition, which withholds
// the base mastery credit for a correct-with-hint answer.

import { useEffect, useMemo, useState } from 'react';
import { setTutorFocus } from '@/lib/tutor-presence';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, KeyRound, LifeBuoy, ArrowLeft, RotateCcw, Wrench } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { AnswerInput } from '@/components/practice/AnswerInput';
import { MistakeTagger } from '@/components/practice/MistakeTagger';
import { AITutorActions } from '@/components/practice/AITutorActions';
import { buttonTap } from '@/lib/animations';
import { celebrateCorrect } from '@/lib/confetti';
import { seededOrder } from '@/lib/shuffle';
import { announce } from '@/lib/a11y/announce';
import { checkAnswer, type CheckResult } from '@/lib/answer-check';
import { recordResult, type ResultSource } from '@/lib/results';
import { recordMistake } from '@/lib/mistakes';
import type { ErrorCategory } from '@/lib/mistakes';
import { seedFromMiss, gradeReview } from '@/lib/review';
import { getWeaknesses } from '@/lib/remediation';
import { getSubTopic } from '@/content/lessons';
import { buildHelpLadder, type HelpTier } from '@/lib/help-ladder';
import { voiceCorrect, voiceWrong } from '@/lib/voice';
import { HelpLadder } from '@/components/practice/HelpLadder';
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
  const [revealed, setRevealed] = useState(false);
  /** The answer the student actually gave on a wrong FIRST attempt, captured at
   *  the moment it happened. The render state it used to be derived from is
   *  cleared by retryMCQ, so it could not survive to the tutor. */
  const [missedWith, setMissedWith] = useState<string | null>(null);
  /** ORIGINAL index of the wrong first pick — the key into distractorNotes,
   *  which is what lets the tutor answer "why is my answer wrong" for $0. */
  const [missedIndex, setMissedIndex] = useState<number | null>(null);

  // "למד אותי" — three graded rungs of help derived from what the question and
  // its sub-topic already carry (lib/help-ladder). `openedLevels` is the whole
  // help state: `hintShown` used to be a boolean, which could not express
  // "took the hint AND the first step", and so could not price help honestly.
  const subTopic = useMemo(() => getSubTopic(subject, topic, subId), [subject, topic, subId]);
  const ladder = useMemo(() => buildHelpLadder(q, subTopic), [q, subTopic]);
  const [openedLevels, setOpenedLevels] = useState<number[]>([]);
  /** Any help taken at all — what `hintUsed` has always meant. */
  const helpTaken = openedLevels.length > 0;
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [mistakeId, setMistakeId] = useState<string | null>(null);
  const [aiCategory, setAiCategory] = useState<ErrorCategory | null>(null);

  const resolved = revealed || firstTryCorrect === true;

  // ===== tell the floating tutor what is on this screen =====
  // Without this the bubble is just a smaller chat box: the student would have
  // to re-type a question that is already in front of both of them. Published
  // from ONE effect keyed on the render state, rather than from each of the
  // answer handlers, so no path can forget to update it — and cleared on
  // unmount, because a stale focus makes the tutor confidently discuss a
  // question the student already left.
  useEffect(() => {
    // `missedWith` and NOT `selected`/`input`: retryMCQ clears the selection a
    // beat after a wrong first answer ("let them pick again"), so deriving the
    // missed answer from render state produced a tutor that announced "ראיתי
    // מה קרה" and then, one render later, had no idea what had happened.
    // Captured at the moment of the miss instead — see logFirst.
    const wrong = firstTryCorrect === false ? (missedWith ?? undefined) : undefined;
    setTutorFocus({
      where: `תרגול · ${subTopic?.title ?? topic}`,
      topic,
      subTopicId: subId,
      questionText: q.question,
      // The authored content behind this screen — hint, solution and the
      // per-distractor notes. Carrying the objects (not just the text) is what
      // lets lib/tutor-local answer the common asks with no API call at all.
      question: q,
      subTopic: subTopic ?? undefined,
      // Decoupled from `wrong`: an MCQ pick and a typed answer are different
      // evidence, and gating both on the same flag meant a typed answer with a
      // perfectly good diagnosis reached the tutor as "he got it wrong" and
      // nothing more.
      ...(missedIndex !== null ? { chosenIndex: missedIndex } : {}),
      ...(check?.diagnosis ? { answerDiagnosis: check.diagnosis } : {}),
      ...(wrong ? { wrongAnswer: wrong } : {}),
      // Only once the page itself has revealed it — the tutor must not be
      // handed the answer while the student is still working on it.
      ...(revealed && q.kind === 'mcq' && typeof q.correct === 'number'
        ? { correctAnswer: q.answers?.[q.correct] }
        : {}),
    });
    return () => setTutorFocus(null);
  }, [q, subId, topic, subTopic, firstTryCorrect, missedWith, missedIndex, check, revealed]);

  // Log the FIRST attempt exactly once (that's the measured one). Wrong first
  // attempts also seed the error notebook and give us a mistakeId to tag.
  //
  // `chosenIndex` is the ORIGINAL option index, not the shuffled one — the
  // whole diagnostic layer depends on that (lib/cognition reads it against the
  // authored per-distractor notes). `pickMCQ` receives `origIdx` by design;
  // don't "simplify" it to the display position.
  function logFirst(
    correct: boolean,
    userAnswer?: string,
    chosenIndex?: number,
    selfReported?: boolean,
  ) {
    // Every path that can register a wrong first attempt funnels through here
    // — MCQ, machine-graded open, and self-report — so this is the one place
    // the missed answer can be captured without a caller forgetting to.
    if (!correct) {
      setMissedWith(userAnswer ?? null);
      setMissedIndex(chosenIndex ?? null);
    }
    recordResult({
      subject,
      topic,
      subTopicId: subId,
      questionId: q.id,
      source,
      difficulty: q.difficulty,
      correct,
      kind: q.kind,
      ...(selfReported !== undefined ? { selfReported } : {}),
      ...(chosenIndex !== undefined ? { chosenIndex } : {}),
      ...(q.kind === 'mcq' && q.answers ? { optionCount: q.answers.length } : {}),
      // True only when the student opened a rung of the help ladder BEFORE this
      // attempt — the auto-open on a miss happens after `logFirst` has already
      // run, so it can't retro-poison the measured attempt.
      ...(helpTaken ? { hintUsed: true } : {}),
    });
    // Spaced repetition: a review answer re-schedules the card; a fresh miss in
    // a practice rung drops the question into the review queue (box 1).
    if (source === 'review') gradeReview(q.id, correct);
    else if (!correct) seedFromMiss({ subject, topic, subTopicId: subId, questionId: q.id });
    // A miss inside a repair path is NOT written to the error notebook.
    //
    // The notebook is a profile ("your number-one mistake is X"), and a fix
    // session by definition serves several questions around one weakness the
    // student already got wrong. Logging each of those would make the profile
    // shout louder about the very thing they are busy repairing — the same way
    // `source: 'teach'` once made /errors report "100% of your mistakes are
    // אחר" (see the MistakeSource note in lib/mistakes.ts). The misses are
    // already counted by lib/remediation, and the question is still scheduled
    // for tomorrow's review above.
    if (!correct && source !== 'fix') {
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

  // The verdict is conveyed by colour and by confetti — neither of which
  // reaches a screen reader. gradeCorrect/gradeWrong are the two funnels every
  // MCQ and open-answer path already flows through, so announcing here covers
  // all of them without touching the callers.
  function gradeCorrect() {
    celebrateCorrect();
    announce('תשובה נכונה');
    setRevealed(true);
  }

  // Wrong: on the FIRST miss open the gentlest unopened rung and offer one free
  // retry; on the second, reveal the full solution.
  function gradeWrong() {
    openNextRungAutomatically();
    // Mirrors the reveal condition below so the announcement never promises a
    // retry the card is not actually offering.
    announce(
      tries >= 2
        ? 'תשובה שגויה. הפתרון המלא נחשף.'
        : 'תשובה שגויה. נפתחה עזרה נוספת — אפשר לנסות שוב.',
      'assertive',
    );
    if (tries >= 2) setRevealed(true);
  }

  /** After a miss, give the next rung of help without being asked — but only
   *  the NEXT one. Jumping straight to the solution is what the ladder exists
   *  to avoid, and a student who already read the hint should get the step. */
  function openNextRungAutomatically() {
    const next = ladder.tiers.find((t) => t.kind !== 'full' && !openedLevels.includes(t.level));
    if (next) setOpenedLevels((prev) => [...prev, next.level]);
  }

  function onOpenTier(tier: HelpTier) {
    if (tier.kind === 'full') {
      announce('הפתרון המלא נחשף');
      setRevealed(true);
      return;
    }
    announce(`${tier.title} נפתח`);
    setOpenedLevels((prev) => (prev.includes(tier.level) ? prev : [...prev, tier.level]));
  }

  function pickMCQ(origIdx: number) {
    if (resolved) return;
    const correct = origIdx === q.correct;
    const nextTries = tries + 1;
    setTries(nextTries);
    setSelected(origIdx);
    if (nextTries === 1) {
      setFirstTryCorrect(correct);
      logFirst(correct, q.answers?.[origIdx], origIdx);
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
      // submitOpen only runs when `expected` exists and isn't 'manual', so this
      // verdict came from lib/answer-check, not from the student.
      logFirst(correct, input, undefined, false);
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
    logFirst(correct, input || undefined, undefined, true);
    setRevealed(true);
    if (correct) celebrateCorrect();
  }

  const wrong = firstTryCorrect === false;

  // The repair offer, at the only moment it is genuinely welcome: the student
  // has just seen the worked solution for a question they got wrong.
  //
  // It appears only when lib/remediation can actually name a weakness in THIS
  // sub-topic — which takes a few answers, by design. A single miss is not a
  // weakness, and a button promising to "fix" one after one mistake would be
  // offering a diagnosis nobody made. Never offered inside a repair session:
  // that is where the student already is.
  //
  // Computed in a memo rather than an effect: the gating conditions can only
  // become true after a click, so this never runs during the server render or
  // hydration, and there is no state to cascade.
  const fixTarget = useMemo(() => {
    if (!wrong || !revealed || source === 'fix') return null;
    const w = getWeaknesses(subject).find((x) => x.subTopicId === subId);
    return w ? { id: w.id, title: w.title } : null;
  }, [wrong, revealed, source, subject, subId]);

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
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-cyan-700 to-violet-600 hover:from-cyan-700 hover:to-violet-500 disabled:opacity-40 px-4 py-2.5 rounded-xl font-bold text-white text-sm transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>בדוק תשובה</span>
          </motion.button>
        </div>
      )}

      {/* "למד אותי" — the graded help ladder, available BEFORE committing on
          every question kind. This is the step between "no idea" and "show me
          the answer": without a middle rung, a proof question offered nothing
          but the full solution, which ends the thinking instead of starting it.
          The `full` rung is withheld until the attempt has been made — see
          lib/help-ladder. */}
      {!revealed && (
        <HelpLadder
          ladder={ladder}
          allowFull={wrong}
          openedLevels={openedLevels}
          onOpen={onOpenTier}
        />
      )}

      {/* 2 · Open answer — no machine-checkable spec → solve on paper, self-report */}
      {q.kind === 'open' && !autoGradable && !revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="w-full inline-flex items-center justify-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/40 px-4 py-3 rounded-xl font-bold text-violet-800 text-sm transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          <span>פתרתי על דף — הצג פתרון להשוואה</span>
        </button>
      )}

      {/* Wrong-first feedback: one free retry. "הצג פתרון" deliberately does NOT
          live here — it is the last rung of the ladder above, so there is one
          graded path to the answer instead of two competing buttons that reach
          it at different depths. */}
      {!revealed && wrong && (
        <motion.div
          key="retry"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2"
        >
          <motion.button
            {...buttonTap}
            onClick={q.kind === 'mcq' ? retryMCQ : retryOpen}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 px-4 py-3 rounded-xl font-black text-white text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> נסה שוב
          </motion.button>
          <div className="text-[10px] text-slate-400 text-center">
            הניסיון הראשון כבר נספר — הניסיון הנוסף הוא בשבילך, ללמוד.
          </div>
        </motion.div>
      )}

      {/* Correct banner */}
      {revealed && firstTryCorrect === true && (
        <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
          <CheckCircle className="w-4 h-4" />
          {voiceCorrect(q.id, { source, firstTry: tries <= 1 })}
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
            {/* FREE, static "why did I get it wrong?" for MCQ — no API. Names the
                specific wrong option the student picked vs the correct one, plus
                an authored per-distractor note when available. */}
            {wrong && q.kind === 'mcq' && selected !== null && q.answers && q.correct != null && (
              <div className="bg-rose-500/[0.06] border border-rose-500/25 rounded-2xl p-4">
                <div className="text-[10px] font-black tracking-widest text-rose-700 uppercase mb-1.5 flex items-center gap-1.5">
                  <XCircle className="w-3 h-3" /> למה טעית?
                </div>
                <div className="text-sm text-slate-800 chat-md leading-relaxed">
                  סימנת <span className="font-bold text-rose-800"><MathText inline>{q.answers[selected]}</MathText></span>,
                  {' '}אבל התשובה הנכונה היא{' '}
                  <span className="font-bold text-emerald-800"><MathText inline>{q.answers[q.correct]}</MathText></span>.
                </div>
                {q.distractorNotes?.[selected] && (
                  <div className="mt-2 text-sm text-rose-900 chat-md leading-relaxed">
                    <MathText>{q.distractorNotes[selected]!}</MathText>
                  </div>
                )}
              </div>
            )}
            {wrong && (
              <div className="flex items-center gap-1.5 text-sm font-bold text-rose-700">
                <XCircle className="w-4 h-4" /> {voiceWrong(q.id)}
              </div>
            )}
            <div className="bg-gradient-to-br from-violet-600/[0.07] to-violet-600/[0.07] border border-violet-500/25 rounded-2xl p-4">
              <div className="text-[10px] font-black tracking-widest text-violet-700 mb-2 uppercase flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" /> פתרון
              </div>
              <ol className="space-y-2">
                {q.solution.steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/25 border border-violet-400/40 flex items-center justify-center text-[10px] font-black text-violet-800">
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

            {/* The repair path — the one CTA that leads somewhere new. */}
            {wrong && fixTarget && (
              <Link
                href={`/fix/${encodeURIComponent(fixTarget.id)}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 px-4 py-3.5 rounded-2xl font-black text-white text-sm shadow-lg shadow-rose-500/20 transition-colors"
              >
                <Wrench className="w-4 h-4" />
                <span>תקן את זה עכשיו — תרגול ממוקד</span>
              </Link>
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
