'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { MathText } from './MathText';
import { AnswerInput } from './AnswerInput';

export type QuestionPart = {
  label: string;
  prompt: string;
  answer_type: 'number' | 'expression' | 'text';
  hints: string[];
  solution: {
    steps: string[];
    final_answer: string;
  };
};

type Verdict = 'correct' | 'partial' | 'wrong';
type CheckResult = { verdict: Verdict; feedback: string; tip: string };

export function QuestionPartCard({
  part,
  context,
  onDone,
}: {
  part: QuestionPart;
  /** Optional surrounding context (question.context) — helps the checker
   *  understand the broader problem when judging a sub-part answer. */
  context?: string;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [answer, setAnswer] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const [stepsShown, setStepsShown] = useState(-1);
  const [revealedFinal, setRevealedFinal] = useState(false);

  // ===== Answer checking state =====
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  function showFullSolution() {
    setStepsShown(0);
  }

  function nextStep() {
    const total = part.solution.steps.length;
    setStepsShown((n) => {
      const next = Math.min(n + 1, total - 1);
      if (next === total - 1 && !revealedFinal) {
        setRevealedFinal(true);
        onDone?.();
      }
      return next;
    });
  }

  async function checkAnswer() {
    if (!answer.trim() || checking) return;
    setChecking(true);
    setCheckError(null);
    setCheckResult(null);
    try {
      const res = await fetch('/api/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: part.prompt,
          correctAnswer: part.solution.final_answer,
          userAnswer: answer,
          context: context ?? '',
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
      const data = (await res.json()) as CheckResult;
      setCheckResult(data);
      // A correct answer counts as "done" — bump the parent so the question
      // gets marked complete even if the student didn't reveal the solution.
      if (data.verdict === 'correct' && !revealedFinal) {
        setRevealedFinal(true);
        onDone?.();
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
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-black text-white shadow-lg shadow-purple-500/30">
          {part.label}
        </div>
        <div className="flex-1 text-right">
          <div className="text-[10px] font-black tracking-widest text-purple-300 uppercase">
            סעיף {part.label}
          </div>
          <div className="text-sm text-slate-200 line-clamp-1 chat-md">
            <MathText inline>{part.prompt}</MathText>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {checkResult?.verdict === 'correct' && (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          )}
          {checkResult?.verdict === 'partial' && (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          {checkResult?.verdict === 'wrong' && (
            <XCircle className="w-4 h-4 text-rose-400" />
          )}
          <div className="text-slate-400">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Prompt */}
          <div className="chat-md text-sm sm:text-base text-white leading-relaxed">
            <MathText>{part.prompt}</MathText>
          </div>

          {/* Answer input + Check button */}
          <div>
            <div className="text-[10px] font-black tracking-widest text-slate-400 mb-1.5 uppercase">
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
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-500/40 px-4 py-2.5 rounded-xl font-bold text-emerald-100 text-sm transition-all"
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
                  <div className="mt-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                    {checkError}
                  </div>
                )}

                {checkResult && (
                  <CheckResultPanel result={checkResult} />
                )}
              </div>
            )}
          </div>

          {/* Hints */}
          {hintsShown > 0 && (
            <div className="space-y-2">
              {part.hints.slice(0, hintsShown).map((h, i) => (
                <div
                  key={i}
                  className="bg-amber-500/5 border border-amber-500/30 rounded-xl px-3 py-2.5 chat-md"
                >
                  <div className="text-[10px] font-black tracking-widest text-amber-300 mb-1 uppercase flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3" />
                    <span>רמז {i + 1}</span>
                  </div>
                  <div className="text-sm text-amber-50/95">
                    <MathText>{h}</MathText>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hintsShown < part.hints.length && stepsShown < 0 && (
            <button
              onClick={() => setHintsShown((n) => Math.min(n + 1, part.hints.length))}
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-4 py-2.5 rounded-xl font-bold text-amber-100 text-sm transition-all"
            >
              <Lightbulb className="w-4 h-4" />
              <span>
                {hintsShown === 0
                  ? 'רמז'
                  : `רמז נוסף (${hintsShown + 1}/${part.hints.length})`}
              </span>
            </button>
          )}

          {/* Solution */}
          {stepsShown >= 0 && (
            <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-4">
              <div className="text-[10px] font-black tracking-widest text-purple-300 mb-2 uppercase flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" />
                <span>פתרון</span>
              </div>
              <ol className="space-y-2.5">
                {part.solution.steps.slice(0, stepsShown + 1).map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-[11px] font-black text-purple-100">
                      {i + 1}
                    </div>
                    <div className="flex-1 chat-md text-sm text-slate-100 pt-0.5">
                      <MathText>{step}</MathText>
                    </div>
                  </li>
                ))}
              </ol>

              {!onLastStep ? (
                <button
                  onClick={nextStep}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 px-4 py-2 rounded-lg font-bold text-purple-100 text-sm transition-all"
                >
                  הצעד הבא ({stepsShown + 2}/{totalSteps})
                </button>
              ) : (
                <div className="mt-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2.5">
                  <div className="text-[10px] font-black tracking-widest text-emerald-300 mb-1 uppercase flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3" />
                    <span>תשובה סופית</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-50 chat-md">
                    <MathText inline>{part.solution.final_answer}</MathText>
                  </div>
                </div>
              )}
            </div>
          )}

          {stepsShown < 0 && (
            <button
              onClick={showFullSolution}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2.5 rounded-xl font-bold text-white text-sm shadow-lg shadow-purple-500/30 transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>הצג פתרון מלא</span>
            </button>
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
          accent: 'text-emerald-300',
          icon: <CheckCircle className="w-4 h-4 text-emerald-300" />,
          label: 'נכון!',
        }
      : result.verdict === 'partial'
      ? {
          wrap: 'bg-amber-500/10 border-amber-500/40',
          accent: 'text-amber-300',
          icon: <AlertCircle className="w-4 h-4 text-amber-300" />,
          label: 'חלקית נכון',
        }
      : {
          wrap: 'bg-rose-500/10 border-rose-500/40',
          accent: 'text-rose-300',
          icon: <XCircle className="w-4 h-4 text-rose-300" />,
          label: 'לא נכון',
        };

  return (
    <div className={`mt-2 ${style.wrap} border rounded-xl px-3 py-2.5 space-y-2`}>
      <div className={`text-xs font-black tracking-widest ${style.accent} uppercase flex items-center gap-1.5`}>
        {style.icon}
        <span>{style.label}</span>
      </div>
      <div className="text-sm text-slate-100 chat-md">
        <MathText>{result.feedback}</MathText>
      </div>
      {result.tip && (
        <div className="text-xs text-slate-300 chat-md border-t border-white/5 pt-2">
          💡 <MathText inline>{result.tip}</MathText>
        </div>
      )}
    </div>
  );
}
