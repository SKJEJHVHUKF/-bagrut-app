'use client';

// LearnLevel — the 📖 "לומדים" rung. Teaches the sub-topic step by step
// (guided lesson steps with their embedded worked examples), then the
// sub-topic's formulas and a "לזכור" recap. Gated on the micro-drills: the
// student must ANSWER every drill before moving on (engagement, not
// correctness). Stars reward getting them right — all first-try-correct → 3★,
// some wrong → 2★, a sub-topic with no drills → 1★ (an honest "acknowledged").

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { FormulaCard } from '@/components/practice/FormulaCard';
import { WorkedExampleCard } from '@/components/practice/WorkedExampleCard';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { buttonTap } from '@/lib/animations';
import type { RoadmapLevel } from '@/lib/roadmap-levels';
import type { AttemptResult } from '@/lib/roadmap-progress';
import type { SubTopic } from '@/content/lessons/types';
import { LevelClearedPanel } from './ladder-ui';
import { MicroDrill } from './MicroDrill';

export function LearnLevel({
  subTopic,
  level,
  onSubmit,
  nextTitle,
  onNext,
  onBack,
}: {
  subTopic: SubTopic;
  level: RoadmapLevel;
  onSubmit: (score: number, total: number, opts?: { viaRetry?: boolean; force?: boolean }) => AttemptResult;
  nextTitle?: string;
  onNext?: () => void;
  onBack: () => void;
}) {
  const [result, setResult] = useState<AttemptResult | null>(null);
  const steps = subTopic.lesson ?? [];

  // A sub-topic's formulas[] is the reference set — FormulaSheet needs it
  // complete. But 72 of 123 of them repeat a formula the student just met
  // inside a lesson step, so on THIS screen they read as filler: the same
  // card twice, a few hundred pixels apart. Show only what the steps didn't
  // already teach. Normalised because the two copies usually differ by no
  // more than a \quad vs \qquad.
  const norm = (s: string) => s.replace(/\\quad|\\qquad/g, '').replace(/\\[,;!]|\s+/g, '');
  const taughtInSteps = new Set(steps.filter((s) => s.formula).map((s) => norm(s.formula!.latex)));
  const extraFormulas = subTopic.formulas.filter((f) => !taughtInSteps.has(norm(f.latex)));
  const drillTotal = steps.filter((s) => s.drill).length;
  const [drillsAnswered, setDrillsAnswered] = useState(0);
  const [drillsCorrect, setDrillsCorrect] = useState(0);
  const allDrillsDone = drillTotal === 0 || drillsAnswered >= drillTotal;

  function onDrillAnswered(correct: boolean) {
    setDrillsAnswered((n) => n + 1);
    if (correct) setDrillsCorrect((n) => n + 1);
  }

  if (result) {
    return (
      <LevelClearedPanel level={level} result={result} nextTitle={nextTitle} onNext={onNext} onBack={onBack} />
    );
  }

  let exampleCount = 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800">
          → לסולם
        </button>
        <span className="font-black text-violet-700">📖 רמת לומדים</span>
      </div>

      {/* Guided steps */}
      {steps.length > 0 ? (
        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.2), ease: 'easeOut' }}
              className="surface-premium rounded-2xl p-4 sm:p-5"
            >
              {/* Step header: solid numbered badge + a title one notch above the
                  body, so the eye finds "where am I" before it starts reading. */}
              <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-900/[0.06]">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-sm shadow-violet-500/30">
                  {i + 1}
                </div>
                <div className="font-black text-slate-900 chat-md lesson-title">
                  <MathText inline>{step.title}</MathText>
                </div>
              </div>
              <div className="chat-md lesson-teach text-slate-800">
                <MathText>{step.teach}</MathText>
              </div>
              {step.formula && (
                <div className="mt-4">
                  <FormulaCard formula={step.formula} />
                </div>
              )}
              {step.diagrams && step.diagrams.length > 0 && <DiagramRenderer diagrams={step.diagrams} />}
              {step.example && (
                <div className="mt-4">
                  <WorkedExampleCard example={step.example} index={exampleCount++} />
                </div>
              )}
              {step.drill && <MicroDrill drill={step.drill} onAnswered={onDrillAnswered} />}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="surface-premium rounded-2xl p-4 sm:p-5 chat-md lesson-teach text-slate-800">
          <MathText>{subTopic.summary}</MathText>
        </div>
      )}

      {/* Formulas the lesson steps did not already cover */}
      {extraFormulas.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-black tracking-widest text-violet-700 uppercase">הנוסחאות של השלב</div>
          {extraFormulas.map((f, i) => (
            <FormulaCard key={i} formula={f} />
          ))}
        </div>
      )}

      {/* Recap */}
      {subTopic.keyPoints.length > 0 && (
        <div className="bg-violet-500/[0.06] border border-violet-500/20 rounded-2xl p-4">
          <div className="text-[10px] font-black tracking-widest text-violet-700 uppercase mb-2">לזכור</div>
          <ul className="space-y-1.5">
            {subTopic.keyPoints.map((k, i) => (
              // chat-md lives on the inner div, NOT the flex <li>: every
              // .chat-md rule is a descendant combinator, so on the <li>
              // itself none of them ever applied. Same shape as PathSections.
              <li key={i} className="flex gap-2 text-sm text-slate-800">
                <span className="text-violet-600 font-black flex-shrink-0">•</span>
                <div className="chat-md flex-1 min-w-0">
                  <MathText inline>{k}</MathText>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {drillTotal > 0 && !allDrillsDone && (
        <div className="text-center text-xs text-slate-500">
          ענה על {drillTotal} התרגילים הקצרים למעלה כדי להמשיך ({drillsAnswered}/{drillTotal})
        </div>
      )}
      <motion.button
        {...buttonTap}
        onClick={() => allDrillsDone && setResult(onSubmit(drillsCorrect, drillTotal))}
        disabled={!allDrillsDone}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-cyan-700 to-violet-600 hover:from-cyan-700 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-violet-500/25 transition-colors"
      >
        <GraduationCap className="w-4 h-4" />
        <span>{drillTotal === 0 ? 'הבנתי — קדימה לתרגול' : 'סיימתי ללמוד — קדימה לתרגול'}</span>
        <ArrowLeft className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
