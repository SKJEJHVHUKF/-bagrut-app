'use client';

// LearnLevel — the 📖 "לומדים" rung. Teaches the sub-topic step by step
// (guided lesson steps with their embedded worked examples), then the
// sub-topic's formulas and a "לזכור" recap. Cleared (3 stars, no grading)
// when the student taps "סיימתי ללמוד" — the gateway into the practice rungs.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { FormulaCard } from '@/components/practice/FormulaCard';
import { WorkedExampleCard } from '@/components/practice/WorkedExampleCard';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { buttonTap } from '@/lib/animations';
import type { RoadmapLevel } from '@/lib/roadmap-levels';
import type { ClearResult } from '@/lib/roadmap-progress';
import type { SubTopic } from '@/content/lessons/types';
import { LevelClearedPanel } from './ladder-ui';

export function LearnLevel({
  subTopic,
  level,
  onCleared,
  nextTitle,
  onNext,
  onBack,
}: {
  subTopic: SubTopic;
  level: RoadmapLevel;
  onCleared: (stars: number, score: number, total: number) => ClearResult;
  nextTitle?: string;
  onNext?: () => void;
  onBack: () => void;
}) {
  const [result, setResult] = useState<ClearResult | null>(null);
  const steps = subTopic.lesson ?? [];

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
        <span className="font-black text-indigo-700">📖 רמת לומדים</span>
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
              className="surface-premium rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-[11px] font-black text-indigo-800 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="text-sm font-black text-slate-900 chat-md">
                  <MathText inline>{step.title}</MathText>
                </div>
              </div>
              <div className="chat-md text-sm text-slate-800 leading-relaxed">
                <MathText>{step.teach}</MathText>
              </div>
              {step.formula && (
                <div className="mt-3">
                  <FormulaCard formula={step.formula} />
                </div>
              )}
              {step.diagrams && step.diagrams.length > 0 && <DiagramRenderer diagrams={step.diagrams} />}
              {step.example && (
                <div className="mt-3">
                  <WorkedExampleCard example={step.example} index={exampleCount++} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="surface-premium rounded-2xl p-4 chat-md text-sm text-slate-800 leading-relaxed">
          <MathText>{subTopic.summary}</MathText>
        </div>
      )}

      {/* Formulas for this sub-topic */}
      {subTopic.formulas.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-black tracking-widest text-indigo-700 uppercase">הנוסחאות של השלב</div>
          {subTopic.formulas.map((f, i) => (
            <FormulaCard key={i} formula={f} />
          ))}
        </div>
      )}

      {/* Recap */}
      {subTopic.keyPoints.length > 0 && (
        <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-2xl p-4">
          <div className="text-[10px] font-black tracking-widest text-indigo-700 uppercase mb-2">לזכור</div>
          <ul className="space-y-1.5">
            {subTopic.keyPoints.map((k, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-800 chat-md">
                <span className="text-indigo-600 font-black">•</span>
                <MathText inline>{k}</MathText>
              </li>
            ))}
          </ul>
        </div>
      )}

      <motion.button
        {...buttonTap}
        onClick={() => setResult(onCleared(3, 0, 0))}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/25 transition-colors"
      >
        <GraduationCap className="w-4 h-4" />
        <span>סיימתי ללמוד — קדימה לתרגול</span>
        <ArrowLeft className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
