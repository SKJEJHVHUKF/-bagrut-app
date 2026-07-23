'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Lightbulb,
  KeyRound,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  XCircle,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { MathText } from './MathText';
import { AnswerInput } from './AnswerInput';
import { AITutorActions } from './AITutorActions';
import { SolutionAudit } from './SolutionAudit';
import { checkAnswer as runDeterministicCheck, type AnswerSpec } from '@/lib/answer-check';
import { sparkle, celebrateCorrect, celebrateCompletion } from '@/lib/confetti';
import { buttonTap } from '@/lib/animations';
import {
  recordMistake,
  updateMistakeCategory,
  toErrorCategory,
  type ErrorCategory,
} from '@/lib/mistakes';
import { recordResult } from '@/lib/results';
import { MistakeTagger } from './MistakeTagger';

export type QuestionPart = {
  label: string;
  prompt: string;
  answer_type: 'number' | 'expression' | 'text';
  hints: string[];
  solution: {
    steps: string[];
    final_answer: string;
  };
  /** Machine-checkable answer spec → deterministic ($0) grading. When
   *  present (value/set), the verdict comes from numeric equivalence, NOT
   *  from a model's judgement. Absent or `manual` falls back to the LLM. */
  expected?: AnswerSpec;
};

type Verdict = 'correct' | 'partial' | 'wrong';
type CheckResult = { verdict: Verdict; feedback: string; tip: string };

export function QuestionPartCard({
  part,
  subject = 'math5',
  context,
  topic,
  subTopicId,
  questionId,
  difficulty,
  onDone,
  onSelfAssess,
}: {
  part: QuestionPart;
  /** Subject key for logging mistakes to the error notebook. */
  subject?: string;
  /** Optional surrounding context (question.context) — helps the checker
   *  understand the broader problem when judging a sub-part answer. */
  context?: string;
  /** Topic key — when it's the grounded pilot ("מספרים מרוכבים") the tutor
   *  endpoints (why-wrong etc.) teach from the verified content. */
  topic?: string;
  /** Sub-topic id, difficulty, and question id — so a graded/self-assessed
   *  outcome is logged to lib/results (source 'bagrut') for /insights + the
   *  grade prediction, not only to the mistake notebook. */
  subTopicId?: string;
  questionId?: string;
  difficulty?: 'easy' | 'mid' | 'hard';
  onDone?: () => void;
  /** Fired when the student self-grades against the revealed solution
   *  ("פתרתי נכון" / "טעיתי כאן"). Lets the parent record the result and
   *  (Task 7) log a mistake with a category. */
  onSelfAssess?: (correct: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const [answer, setAnswer] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const [stepsShown, setStepsShown] = useState(-1);
  const [revealedFinal, setRevealedFinal] = useState(false);
  // Self-assessment after revealing the full solution (the "solved on paper"
  // path) — null until the student grades themselves.
  const [selfReport, setSelfReport] = useState<'correct' | 'wrong' | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  // Error-notebook state — one mistake per part, re-taggable.
  const [mistakeId, setMistakeId] = useState<string | null>(null);
  const [aiCategory, setAiCategory] = useState<ErrorCategory | null>(null);
  // Log the FIRST measured outcome (graded or self-assessed) to lib/results so
  // /insights + grade prediction count bagrut work — once per part.
  const [recorded, setRecorded] = useState(false);
  function recordOutcome(correct: boolean) {
    if (recorded) return;
    setRecorded(true);
    recordResult({ subject, topic: topic ?? '', subTopicId, questionId, source: 'bagrut', difficulty, correct });
  }

  // Log a wrong answer to the error notebook (once per part). If a category
  // is known (from the AI), apply it; otherwise it defaults to 'אחר' and the
  // student can tag it via the MistakeTagger.
  function logWrong(userAnswer: string, category?: ErrorCategory) {
    if (mistakeId) {
      if (category) {
        updateMistakeCategory(mistakeId, category);
        setAiCategory(category);
      }
      return;
    }
    const id = recordMistake({
      subject,
      topic: topic ?? '',
      questionText: part.prompt,
      userAnswer: userAnswer || undefined,
      correctAnswer: part.solution.final_answer,
      category: category ?? 'אחר',
      source: 'bagrut',
    });
    setMistakeId(id);
    if (category) setAiCategory(category);
  }

  function selfAssess(correct: boolean) {
    if (selfReport) return;
    setSelfReport(correct ? 'correct' : 'wrong');
    recordOutcome(correct);
    if (correct) {
      celebrateCorrect();
      toast.success('כל הכבוד! 🎯', { description: 'סימנת שפתרת נכון', duration: 2000 });
    } else {
      toast.info('סומן — כדאי לחזור על הסעיף הזה', { duration: 2000 });
      logWrong(answer);
    }
    onSelfAssess?.(correct);
  }

  // ===== Answer checking state =====
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  // Snapshot of the wrong answer so the "Why wrong?" tutor button can
  // explain THIS specific mistake (not the standard solution).
  const [lastUserAnswer, setLastUserAnswer] = useState('');

  function showFullSolution() {
    // Reveal the WHOLE solution at once (like the bagrut archive) — not
    // step-by-step. Showing the last index renders every step + the final
    // answer immediately, and marks the part done.
    setStepsShown(part.solution.steps.length - 1);
    if (!revealedFinal) {
      setRevealedFinal(true);
      celebrateCompletion();
      onDone?.();
    }
    toast.success(`סעיף ${part.label} — פתרון מלא`, {
      description: 'עבור על הפתרון ובדוק שהבנת',
      duration: 2000,
    });
  }

  function nextStep() {
    const total = part.solution.steps.length;
    setStepsShown((n) => {
      const next = Math.min(n + 1, total - 1);
      if (next === total - 1 && !revealedFinal) {
        setRevealedFinal(true);
        celebrateCompletion();
        toast.success(`סעיף ${part.label} הושלם! 🎯`, {
          description: 'עברת על כל הצעדים',
          duration: 2500,
        });
        onDone?.();
      }
      return next;
    });
  }

  function revealHint() {
    setHintsShown((n) => {
      const next = Math.min(n + 1, part.hints.length);
      sparkle();
      toast.info(`רמז ${next} מתוך ${part.hints.length}`, {
        description: 'נסה לפתור עם הרמז לפני שתחשוף את הפתרון',
        duration: 2500,
      });
      return next;
    });
  }

  // Apply a verdict to the UI — toasts, completion, confetti. Shared by the
  // deterministic path and the LLM fallback so they behave identically.
  function applyResult(data: CheckResult) {
    setCheckResult(data);
    // A correct answer counts as "done" — bump the parent so the question
    // gets marked complete even if the student didn't reveal the solution.
    if (data.verdict === 'correct' && !revealedFinal) {
      setRevealedFinal(true);
      recordOutcome(true);
      celebrateCorrect();
      toast.success('תשובה נכונה! 🎯', {
        description: `סעיף ${part.label} נסגר בכבוד`,
        duration: 2500,
      });
      onDone?.();
    } else if (data.verdict === 'partial') {
      toast.info('כמעט שם — תשובה חלקית', {
        description: 'קרא את הפידבק ונסה לתקן',
        duration: 2500,
      });
    } else if (data.verdict === 'wrong') {
      recordOutcome(false);
      toast.error('לא נכון', {
        description: 'אל תוותר — נסה רמז או בקש "למה טעיתי?"',
        duration: 2500,
      });
    }
  }

  async function checkAnswer() {
    if (!answer.trim() || checking) return;
    setChecking(true);
    setCheckError(null);
    setCheckResult(null);
    // Capture the answer NOW so the tutor's "why wrong?" panel can
    // reference what the student actually typed, even if they edit
    // the input afterwards.
    setLastUserAnswer(answer);

    // ===== 1) DETERMINISTIC CHECK FIRST (free, instant, authoritative) =====
    // For parts with a machine-checkable spec (value / set), the verdict is
    // decided by NUMERIC EQUIVALENCE — never a model's guess. Equivalent
    // forms (e.g. $2\,\text{cis}\,60° = 1+\sqrt{3}\,i$) are accepted; a
    // partial set (one root out of three) is correctly marked wrong. The
    // model is only ever asked to *explain* a mistake, never to *judge*.
    const spec = part.expected;
    if (spec && spec.kind !== 'manual') {
      const det = runDeterministicCheck(answer, spec);
      if (det.verdict === 'correct') {
        applyResult({
          verdict: 'correct',
          feedback: 'התשובה שלך שקולה מתמטית לתשובה הנכונה. מצוין! ✓',
          tip: '',
        });
        setChecking(false);
        return;
      }
      if (det.verdict === 'wrong') {
        applyResult({
          verdict: 'wrong',
          feedback: det.readAs
            ? `קראתי את התשובה שלך כ-$${det.readAs}$ — היא אינה שקולה לתשובה הנכונה. בדוק אם פספסת חלק מהפתרון או טעית בסימן.`
            : 'התשובה אינה שקולה לתשובה הנכונה. בדוק אם פספסת חלק מהפתרון או טעית בסימן.',
          tip: '',
        });
        logWrong(answer);
        setChecking(false);
        return;
      }
      // 'unparseable' (couldn't read input) or 'manual' (bad spec) → fall
      // through to the LLM, which is more forgiving of messy free text.
    }

    // ===== 2) LLM FALLBACK (proofs, geometric loci, unparseable input) =====
    // The model judges here — grounded in the verified content for the pilot
    // topic. This is the EXCEPTION, not the default path.
    try {
      const res = await fetch('/api/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: part.prompt,
          correctAnswer: part.solution.final_answer,
          userAnswer: answer,
          context: context ?? '',
          topic: topic ?? '',
        }),
      });
      if (!res.ok) {
        let msg = '';
        try {
          const j = await res.json();
          msg = j?.error ?? '';
        } catch {
          msg = await res.text().catch(() => '');
        }
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as CheckResult & { category?: string };
      applyResult(data);
      if (data.verdict === 'wrong') {
        logWrong(answer, toErrorCategory(data.category));
      }
    } catch (e) {
      setCheckError(e instanceof Error ? e.message : String(e));
    } finally {
      setChecking(false);
    }
  }

  const totalSteps = part.solution.steps.length;
  const onLastStep = stepsShown === totalSteps - 1;
  const answerLocked = checkResult?.verdict === 'correct' || onLastStep;
  const canCheck = answer.trim().length > 0 && !checking && !answerLocked;

  return (
    <div className="surface-premium rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-slate-900/[0.02] transition-colors"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/30">
          {part.label}
        </div>
        <div className="flex-1 text-right">
          <div className="text-[10px] font-black tracking-widest text-indigo-700 uppercase">
            סעיף {part.label}
          </div>
          <div className="text-sm text-slate-800 line-clamp-1 chat-md">
            <MathText inline>{part.prompt}</MathText>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {checkResult?.verdict === 'correct' && (
            <CheckCircle className="w-4 h-4 text-emerald-700" />
          )}
          {checkResult?.verdict === 'partial' && (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          {checkResult?.verdict === 'wrong' && (
            <XCircle className="w-4 h-4 text-indigo-600" />
          )}
          <div className="text-slate-600">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-900/[0.06] pt-3">
          {/* Prompt */}
          <div className="chat-md text-sm sm:text-base text-slate-900 leading-relaxed">
            <MathText>{part.prompt}</MathText>
          </div>

          {/* Answer input + Check button */}
          <div>
            <div className="text-[10px] font-black tracking-widest text-slate-600 mb-1.5 uppercase">
              התשובה שלי
            </div>
            <AnswerInput
              value={answer}
              onChange={setAnswer}
              type={part.answer_type}
              disabled={answerLocked}
            />

            {/* Check button + result — only shown if solution not yet opened */}
            {stepsShown < 0 && (
              <div className="mt-2">
                <button
                  onClick={checkAnswer}
                  disabled={!canCheck}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-500/40 px-4 py-2.5 rounded-xl font-bold text-emerald-800 text-sm transition-all"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>בודק…</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>בדוק תשובה</span>
                    </>
                  )}
                </button>

                {checkError && (
                  <div className="mt-2 text-xs text-indigo-700 bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-3 py-2">
                    {checkError}
                  </div>
                )}

                {checkResult && (
                  <CheckResultPanel result={checkResult} />
                )}

                {/* AI tutor: "why did I get this wrong?" — only when the
                    verdict says wrong AND we have the snapshotted user
                    answer to send. Pinpoints the SPECIFIC mistake. */}
                {checkResult?.verdict === 'wrong' && lastUserAnswer && (
                  <AITutorActions
                    question={part.prompt}
                    correctAnswer={part.solution.final_answer}
                    userAnswer={lastUserAnswer}
                    context={context}
                    topic={topic}
                    show={{ whyWrong: true }}
                    onCategory={(c) => {
                      const cat = toErrorCategory(c);
                      if (mistakeId) {
                        updateMistakeCategory(mistakeId, cat);
                        setAiCategory(cat);
                      }
                    }}
                  />
                )}

                {mistakeId && checkResult?.verdict === 'wrong' && (
                  <MistakeTagger mistakeId={mistakeId} initial={aiCategory} />
                )}
              </div>
            )}
          </div>

          {/* Hints — each slides in from top */}
          <AnimatePresence initial={false}>
            {hintsShown > 0 && (
              <motion.div
                key="hints"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {part.hints.slice(0, hintsShown).map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="bg-amber-500/5 border border-amber-500/30 rounded-xl px-3 py-2.5 chat-md"
                  >
                    <div className="text-[10px] font-black tracking-widest text-amber-700 mb-1 uppercase flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3" />
                      <span>רמז {i + 1}</span>
                    </div>
                    <div className="text-sm text-amber-900">
                      <MathText>{h}</MathText>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {hintsShown < part.hints.length && stepsShown < 0 && (
            <motion.button
              {...buttonTap}
              onClick={revealHint}
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-4 py-2.5 rounded-xl font-bold text-amber-800 text-sm transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              <span>
                {hintsShown === 0
                  ? 'רמז'
                  : `רמז נוסף (${hintsShown + 1}/${part.hints.length})`}
              </span>
            </motion.button>
          )}

          {/* AI tutor: "step-by-step help" after all hints exhausted but
              before showing the full solution. The Pro-gated button asks
              Claude to unpack the LAST hint without revealing the answer. */}
          {hintsShown === part.hints.length && stepsShown < 0 && part.hints.length > 0 && (
            <AITutorActions
              question={part.prompt}
              hints={part.hints}
              context={context}
              topic={topic}
              show={{ hintHelp: true }}
            />
          )}

          {/* Solution — cascades in step by step */}
          <AnimatePresence initial={false}>
            {stepsShown >= 0 && (
              <motion.div
                key="solution"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
                className="bg-gradient-to-br from-indigo-600/10 to-indigo-600/10 border border-indigo-500/30 rounded-xl p-4"
              >
                <div className="text-[10px] font-black tracking-widest text-indigo-700 mb-2 uppercase flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3" />
                  <span>פתרון</span>
                </div>
                <ol className="space-y-2.5">
                  {part.solution.steps.slice(0, stepsShown + 1).map((step, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="flex gap-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/30 border border-indigo-400/50 flex items-center justify-center text-[11px] font-black text-indigo-800">
                        {i + 1}
                      </div>
                      <div className="flex-1 chat-md text-sm text-slate-800 pt-0.5">
                        <MathText>{step}</MathText>
                      </div>
                    </motion.li>
                  ))}
                </ol>

                {!onLastStep ? (
                  <motion.button
                    {...buttonTap}
                    onClick={nextStep}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 px-4 py-2 rounded-lg font-bold text-indigo-800 text-sm transition-colors"
                  >
                    הצעד הבא ({stepsShown + 2}/{totalSteps})
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                    className="mt-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2.5"
                  >
                    <div className="text-[10px] font-black tracking-widest text-emerald-700 mb-1 uppercase flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3" />
                      <span>תשובה סופית</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-900 chat-md">
                      <MathText inline>{part.solution.final_answer}</MathText>
                    </div>
                  </motion.div>
                )}

                {/* AI tutor: "explain simpler" — once the full solution has
                    been revealed, the student may still not grok WHY. This
                    button asks Claude for a 3-sentence plain-Hebrew gloss. */}
                {onLastStep && (
                  <AITutorActions
                    question={part.prompt}
                    solution={part.solution.steps.join('\n') + '\n' + part.solution.final_answer}
                    context={context}
                    topic={topic}
                    show={{ explainSimpler: true }}
                  />
                )}

                {/* Self-assessment — the "solved on paper" payoff. Lets the
                    student grade their own draft against the solution instead
                    of fighting strict string-matching on messy expressions. */}
                {onLastStep && checkResult?.verdict !== 'correct' && (
                  <div className="mt-3 pt-3 border-t border-indigo-500/20">
                    {selfReport === null ? (
                      <>
                        <div className="text-[11px] font-bold text-slate-600 mb-2 text-center">
                          השווה את הפתרון שלך — איך יצא לך?
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => selfAssess(true)}
                            className="inline-flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-3 py-2 rounded-lg font-bold text-emerald-800 text-sm transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            פתרתי נכון
                          </button>
                          <button
                            onClick={() => selfAssess(false)}
                            className="inline-flex items-center justify-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 px-3 py-2 rounded-lg font-bold text-amber-800 text-sm transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            טעיתי כאן
                          </button>
                        </div>
                      </>
                    ) : selfReport === 'correct' ? (
                      <div className="text-center text-xs font-bold text-emerald-700">
                        ✓ סימנת: פתרתי נכון
                      </div>
                    ) : (
                      <div>
                        <div className="text-center text-xs font-bold text-amber-700 mb-1">
                          סומן: טעיתי — נחזור לזה בתרגול
                        </div>
                        {mistakeId && <MistakeTagger mistakeId={mistakeId} initial={aiCategory} />}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {stepsShown < 0 && (
            <motion.button
              {...buttonTap}
              onClick={showFullSolution}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-4 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg shadow-indigo-500/30 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span>פתרתי על דף — הצג פתרון מלא</span>
            </motion.button>
          )}

          {stepsShown < 0 && (
            <button
              onClick={() => setShowAudit((v) => !v)}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 px-4 py-2 rounded-xl font-bold text-slate-700 text-sm transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>בדוק את הפתרון שלי מצילום</span>
              <span className="text-[9px] opacity-70">Pro</span>
            </button>
          )}
          {showAudit && (
            <SolutionAudit
              questionText={part.prompt}
              topic={topic}
              subject={subject}
              onClose={() => setShowAudit(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Sub-component for the verdict panel.
// ----------------------------------------------------------------------------
function CheckResultPanel({ result }: { result: CheckResult }) {
  const style =
    result.verdict === 'correct'
      ? {
          wrap: 'bg-emerald-500/10 border-emerald-500/40',
          accent: 'text-emerald-700',
          icon: <CheckCircle className="w-4 h-4 text-emerald-700" />,
          label: 'נכון!',
        }
      : result.verdict === 'partial'
      ? {
          wrap: 'bg-amber-500/10 border-amber-500/40',
          accent: 'text-amber-700',
          icon: <AlertCircle className="w-4 h-4 text-amber-700" />,
          label: 'חלקית נכון',
        }
      : {
          wrap: 'bg-indigo-500/10 border-indigo-500/40',
          accent: 'text-indigo-700',
          icon: <XCircle className="w-4 h-4 text-indigo-700" />,
          label: 'לא נכון',
        };

  return (
    <div className={`mt-2 ${style.wrap} border rounded-xl px-3 py-2.5 space-y-2`}>
      <div className={`text-xs font-black tracking-widest ${style.accent} uppercase flex items-center gap-1.5`}>
        {style.icon}
        <span>{style.label}</span>
      </div>
      <div className="text-sm text-slate-800 chat-md">
        <MathText>{result.feedback}</MathText>
      </div>
      {result.tip && (
        <div className="text-xs text-slate-700 chat-md border-t border-slate-900/[0.06] pt-2">
          💡 <MathText inline>{result.tip}</MathText>
        </div>
      )}
    </div>
  );
}
