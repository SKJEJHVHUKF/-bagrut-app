'use client';

import { useState } from 'react';
import { Lightbulb, KeyRound, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
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

export function QuestionPartCard({
  part,
  onDone,
}: {
  part: QuestionPart;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [answer, setAnswer] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const [stepsShown, setStepsShown] = useState(-1);
  const [revealedFinal, setRevealedFinal] = useState(false);

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

  const totalSteps = part.solution.steps.length;
  const onLastStep = stepsShown === totalSteps - 1;

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
        <div className="flex-shrink-0 text-slate-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Prompt */}
          <div className="chat-md text-sm sm:text-base text-white leading-relaxed">
            <MathText>{part.prompt}</MathText>
          </div>

          {/* Answer input */}
          <div>
            <div className="text-[10px] font-black tracking-widest text-slate-400 mb-1.5 uppercase">
              התשובה שלי
            </div>
            <AnswerInput
              value={answer}
              onChange={setAnswer}
              type={part.answer_type}
              disabled={onLastStep}
            />
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
